import { outboxAll, outboxPut, outboxDelete, outboxCount, metaSet } from '../db/idb.js'
import { saveDay, clearDay } from '../api/sheets.js'
import { SYNC } from '../lib/constants.js'

// The sync engine owns the outbox. The UI never calls the network directly for
// writes — it enqueues an operation here, which is replayed when online.
//
// Each outbox item:
//   { id, op: 'saveDay' | 'clearDay', month, day, values, ts }
// id is deterministic per (op,month,day) so re-editing the same day before a
// sync collapses into one pending write instead of piling up.

const listeners = new Set()
let status = navigator.onLine ? SYNC.SYNCED : SYNC.OFFLINE
let flushing = false

function emit() {
  outboxCount().then((pending) => {
    for (const fn of listeners) fn({ status, pending })
  })
}

export function onSyncChange(fn) {
  listeners.add(fn)
  emit()
  return () => listeners.delete(fn)
}

export function getStatus() {
  return status
}

function setStatus(s) {
  status = s
  emit()
}

// Queue a write and try to flush immediately.
export async function enqueue(op, { month, day, values }) {
  const id = `${op}:${month}:${day}`
  await outboxPut({ id, op, month, day, values, ts: Date.now() })
  emit()
  flush()
}

// Replay the outbox in timestamp order. Safe to call often; it self-guards.
export async function flush() {
  if (flushing) return
  if (!navigator.onLine) {
    setStatus(SYNC.OFFLINE)
    return
  }

  const items = (await outboxAll()).sort((a, b) => a.ts - b.ts)
  if (items.length === 0) {
    setStatus(SYNC.SYNCED)
    return
  }

  flushing = true
  setStatus(SYNC.SYNCING)
  try {
    for (const item of items) {
      try {
        if (item.op === 'saveDay') {
          await saveDay(item.month, item.day, item.values)
        } else if (item.op === 'clearDay') {
          await clearDay(item.month, item.day)
        }
        await outboxDelete(item.id)
        emit()
      } catch (err) {
        // Network blip mid-flush: stop, keep the rest queued, retry later.
        if (!navigator.onLine) { setStatus(SYNC.OFFLINE); return }
        setStatus(SYNC.ERROR)
        return
      }
    }
    await metaSet('lastSync', Date.now())
    setStatus(SYNC.SYNCED)
  } finally {
    flushing = false
  }
}

// Wire up automatic flushing on reconnect / tab focus.
export function startSyncEngine() {
  window.addEventListener('online', () => { setStatus(SYNC.SYNCING); flush() })
  window.addEventListener('offline', () => setStatus(SYNC.OFFLINE))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') flush()
  })
  // Periodic safety-net retry.
  setInterval(() => { if (navigator.onLine) flush() }, 30000)
  flush()
}
