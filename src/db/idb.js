// Tiny promise-based IndexedDB wrapper. No dependencies.
//
// Three stores:
//   cache  – last-known month/summary payloads, so the app opens instantly
//            and works fully offline (read).
//   outbox – queued day edits made while offline (or that failed to send),
//            replayed in order when connectivity returns (write).
//   meta   – misc key/values (e.g. last sync time).

const DB_NAME = 'grocery-sales'
const DB_VERSION = 1

let dbp = null

function open() {
  if (dbp) return dbp
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache')
      if (!db.objectStoreNames.contains('outbox')) {
        db.createObjectStore('outbox', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbp
}

function tx(store, mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode)
        const s = t.objectStore(store)
        const out = fn(s)
        t.oncomplete = () => resolve(out?._result ?? out)
        t.onerror = () => reject(t.error)
        t.onabort = () => reject(t.error)
      })
  )
}

const wrap = (req) => {
  const box = {}
  req.onsuccess = () => { box._result = req.result }
  return box
}

// --- cache ---------------------------------------------------------------
export const cacheGet = (key) => tx('cache', 'readonly', (s) => wrap(s.get(key)))
export const cacheSet = (key, val) => tx('cache', 'readwrite', (s) => s.put(val, key))

// --- meta ----------------------------------------------------------------
export const metaGet = (key) => tx('meta', 'readonly', (s) => wrap(s.get(key)))
export const metaSet = (key, val) => tx('meta', 'readwrite', (s) => s.put(val, key))

// --- outbox --------------------------------------------------------------
export const outboxAll = () =>
  tx('outbox', 'readonly', (s) => wrap(s.getAll())).then((r) => r || [])

export const outboxPut = (item) => tx('outbox', 'readwrite', (s) => s.put(item))

export const outboxDelete = (id) => tx('outbox', 'readwrite', (s) => s.delete(id))

export const outboxCount = () =>
  tx('outbox', 'readonly', (s) => wrap(s.count())).then((r) => r || 0)
