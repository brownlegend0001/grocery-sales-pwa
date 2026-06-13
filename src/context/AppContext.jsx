import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { MONTHS, SYNC, INPUT_FIELDS } from '../lib/constants.js'
import { daysInMonth, weekdayFor, todayParts } from '../lib/format.js'
import { deriveDay, summariseMonth } from '../lib/calc.js'
import { YEAR, IS_CONFIGURED } from '../config.js'
import { fetchMonth } from '../api/sheets.js'
import { cacheGet, cacheSet } from '../db/idb.js'
import { enqueue, onSyncChange, startSyncEngine, flush } from '../sync/syncEngine.js'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

// Build a blank month skeleton (one row per calendar day) so the UI always has
// a full grid even before any data loads.
function blankMonth(monthIndex) {
  const n = daysInMonth(YEAR, monthIndex)
  return Array.from({ length: n }, (_, i) => {
    const day = i + 1
    return deriveDay({
      date: day,
      weekday: weekdayFor(YEAR, monthIndex, day),
      cash: '', online: '', card: '',
      salonCash: '', salonOnline: '', expenses: '', toSuppliers: ''
    })
  })
}

// Merge server/cached rows into the blank skeleton by date.
function mergeMonth(monthIndex, rows = []) {
  const base = blankMonth(monthIndex)
  const byDate = new Map(rows.map((r) => [Number(r.date), r]))
  return base.map((d) => {
    const r = byDate.get(d.date)
    return r ? deriveDay({ ...d, ...r, date: d.date, weekday: d.weekday }) : d
  })
}

export function AppProvider({ children }) {
  const initial = todayParts().monthIndex
  const [monthIndex, setMonthIndex] = useState(
    todayParts().year === YEAR ? initial : 0
  )
  const [monthData, setMonthData] = useState(() => blankMonth(monthIndex))
  const [summary, setSummary] = useState(null)
  const [sync, setSync] = useState({ status: navigator.onLine ? SYNC.SYNCED : SYNC.OFFLINE, pending: 0 })
  const [loading, setLoading] = useState(false)
  const loadedMonths = useRef(new Set())

  // Subscribe to sync engine + boot it once.
  useEffect(() => {
    const off = onSyncChange(setSync)
    startSyncEngine()
    return off
  }, [])

  // Load a month: cache-first (instant), then network (refresh).
  const loadMonth = useCallback(async (mi, { force = false } = {}) => {
    const month = MONTHS[mi]
    const cached = await cacheGet(`month:${month}`)
    if (cached) setMonthData(mergeMonth(mi, cached))

    if (!IS_CONFIGURED) { setMonthData((d) => d.length ? d : blankMonth(mi)); return }
    if (!navigator.onLine) return
    if (!force && loadedMonths.current.has(month)) return

    try {
      setLoading(true)
      const rows = await fetchMonth(month)
      loadedMonths.current.add(month)
      await cacheSet(`month:${month}`, rows)
      setMonthData(mergeMonth(mi, rows))
    } catch {
      /* keep cached/blank data on failure */
    } finally {
      setLoading(false)
    }
  }, [])

  // Build the whole-year rollup CLIENT-SIDE from the same per-month data the
  // dashboard uses. Cache-first for instant paint, then refresh every month in
  // parallel when online. This avoids the heavy/fragile server getSummary call.
  const buildYear = useCallback(async ({ force = false } = {}) => {
    const cachedSummary = await cacheGet('summary')
    if (cachedSummary && !force) setSummary(cachedSummary)

    const rows = []
    for (let mi = 0; mi < MONTHS.length; mi++) {
      rows[mi] = (await cacheGet(`month:${MONTHS[mi]}`)) || []
    }

    if (IS_CONFIGURED && navigator.onLine) {
      const results = await Promise.allSettled(MONTHS.map((m) => fetchMonth(m)))
      for (let mi = 0; mi < results.length; mi++) {
        if (results[mi].status === 'fulfilled') {
          rows[mi] = results[mi].value
          await cacheSet(`month:${MONTHS[mi]}`, results[mi].value)
        }
      }
    }

    const months = MONTHS.map((name, mi) => ({ month: name, ...summariseMonth(rows[mi]) }))
    const yearTotal = months.reduce((a, m) => {
      a.totalSales += m.totalSales; a.cash += m.cash; a.online += m.online; a.card += m.card
      a.salon += m.salon; a.expenses += m.expenses; a.toSuppliers += m.toSuppliers; a.netProfit += m.netProfit
      return a
    }, { totalSales: 0, cash: 0, online: 0, card: 0, salon: 0, expenses: 0, toSuppliers: 0, netProfit: 0 })

    const summaryObj = { year: YEAR, yearTotal, months }
    await cacheSet('summary', summaryObj)
    setSummary(summaryObj)
    return summaryObj
  }, [])

  // React to month changes.
  useEffect(() => {
    setMonthData(blankMonth(monthIndex))
    loadMonth(monthIndex)
  }, [monthIndex, loadMonth])

  // After a successful flush returns us to SYNCED, refresh the current month.
  // (The Year tab rebuilds itself whenever it's opened.)
  const prevStatus = useRef(sync.status)
  useEffect(() => {
    if (prevStatus.current === SYNC.SYNCING && sync.status === SYNC.SYNCED) {
      loadMonth(monthIndex, { force: true })
    }
    prevStatus.current = sync.status
  }, [sync.status, monthIndex, loadMonth])

  // Optimistically update a day locally, then queue the write.
  const updateDay = useCallback((day, values) => {
    setMonthData((rows) =>
      rows.map((r) => (r.date === day ? deriveDay({ ...r, ...values }) : r))
    )
    // Persist optimistic state to cache so a reload offline keeps the edit.
    setMonthData((rows) => {
      cacheSet(`month:${MONTHS[monthIndex]}`, rows)
      return rows
    })
    enqueue('saveDay', { month: MONTHS[monthIndex], day, values })
  }, [monthIndex])

  // Bulk import day records into a month (from a CSV/JSON file). Merges into
  // cache, refreshes the view if it's the open month, and queues each day to
  // sync to the Sheet.
  const applyImport = useCallback(async (mi, days) => {
    const month = MONTHS[mi]
    const cached = (await cacheGet(`month:${month}`)) || []
    const byDate = new Map(cached.map((r) => [Number(r.date), r]))
    let count = 0

    for (const d of days) {
      const date = Number(d.date)
      if (!date) continue
      const prev = byDate.get(date) || { date }
      byDate.set(date, { ...prev, ...d, date })
      const values = {}
      for (const f of INPUT_FIELDS) values[f.key] = Number(d[f.key]) || 0
      enqueue('saveDay', { month, day: date, values })
      count++
    }

    const merged = Array.from(byDate.values()).sort((a, b) => a.date - b.date)
    await cacheSet(`month:${month}`, merged)
    if (mi === monthIndex) setMonthData(mergeMonth(mi, merged))
    return count
  }, [monthIndex])

  const removeDay = useCallback((day) => {
    const blank = { cash: '', online: '', card: '', salonCash: '', salonOnline: '', expenses: '', toSuppliers: '' }
    setMonthData((rows) => {
      const next = rows.map((r) => (r.date === day ? deriveDay({ ...r, ...blank }) : r))
      cacheSet(`month:${MONTHS[monthIndex]}`, next)
      return next
    })
    enqueue('clearDay', { month: MONTHS[monthIndex], day })
  }, [monthIndex])

  const value = {
    YEAR,
    monthIndex,
    month: MONTHS[monthIndex],
    setMonthIndex,
    monthData,
    summary,
    sync,
    loading,
    isConfigured: IS_CONFIGURED,
    updateDay,
    removeDay,
    applyImport,
    buildYear,
    refresh: () => { loadMonth(monthIndex, { force: true }); buildYear({ force: true }); flush() }
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
