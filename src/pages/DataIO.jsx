import { useRef, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { MONTHS, MONTH_FULL } from '../lib/constants.js'
import { YEAR, IS_CONFIGURED } from '../config.js'
import { monthToCSV, parseMonthCSV } from '../lib/csv.js'
import { downloadFile, readFileText } from '../lib/download.js'
import { cacheGet } from '../db/idb.js'
import { fetchMonth } from '../api/sheets.js'
import { deriveDay } from '../lib/calc.js'
import MonthTabs from '../components/MonthTabs.jsx'

export default function DataIO() {
  const { monthIndex, month, monthData, applyImport } = useApp()
  const csvInput = useRef(null)
  const jsonInput = useRef(null)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState(null) // { kind, text }

  const note = (kind, text) => { setMsg({ kind, text }); setTimeout(() => setMsg(null), 5000) }

  // ---- Export ----
  const exportMonthCSV = () => {
    const csv = monthToCSV(monthData)
    downloadFile(`${month}-${YEAR}.csv`, 'text/csv;charset=utf-8', csv)
  }

  // Gather every month for a full backup: live when online & connected, else
  // whatever is cached on this device.
  const exportYearJSON = async () => {
    setBusy('export')
    try {
      const all = {}
      for (const m of MONTHS) {
        let rows = null
        if (IS_CONFIGURED && navigator.onLine) {
          try { rows = await fetchMonth(m) } catch { /* fall back to cache */ }
        }
        if (!rows) rows = (await cacheGet(`month:${m}`)) || []
        all[m] = rows.map(deriveDay)
      }
      const backup = { app: 'grocery-sales', year: YEAR, exportedAt: new Date().toISOString(), months: all }
      downloadFile(`sales-backup-${YEAR}.json`, 'application/json', JSON.stringify(backup, null, 2))
      note('ok', 'Full-year backup downloaded.')
    } catch (e) {
      note('err', 'Export failed: ' + e.message)
    } finally {
      setBusy('')
    }
  }

  // ---- Import ----
  const importCSV = async (file) => {
    if (!file) return
    setBusy('csv')
    try {
      const text = await readFileText(file)
      const days = parseMonthCSV(text)
      if (!days.length) throw new Error('No valid rows found')
      const n = await applyImport(monthIndex, days)
      note('ok', `Imported ${n} days into ${month}. Syncing to your Sheet…`)
    } catch (e) {
      note('err', 'Import failed: ' + e.message)
    } finally {
      setBusy(''); if (csvInput.current) csvInput.current.value = ''
    }
  }

  const importJSON = async (file) => {
    if (!file) return
    setBusy('json')
    try {
      const text = await readFileText(file)
      const data = JSON.parse(text)
      const months = data.months || data
      let total = 0
      for (let mi = 0; mi < MONTHS.length; mi++) {
        const rows = months[MONTHS[mi]]
        if (Array.isArray(rows) && rows.length) total += await applyImport(mi, rows)
      }
      if (!total) throw new Error('No month data in file')
      note('ok', `Restored ${total} days across the year. Syncing…`)
    } catch (e) {
      note('err', 'Restore failed: ' + e.message)
    } finally {
      setBusy(''); if (jsonInput.current) jsonInput.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <MonthTabs />

      {msg && (
        <div className={`card p-3 text-sm ${msg.kind === 'ok' ? 'border-accent/40 text-accent' : 'border-danger/40 text-danger'}`}>
          {msg.text}
        </div>
      )}

      {/* Export */}
      <section className="card p-4">
        <h2 className="text-sm font-semibold text-white">Export</h2>
        <p className="mt-1 text-xs text-slate-400">Download your data to share or back up.</p>
        <div className="mt-3 space-y-2">
          <button onClick={exportMonthCSV} className="tap flex w-full items-center justify-between rounded-xl bg-ink px-4 py-3 border border-line/60">
            <span className="text-sm font-medium text-white">Export {MONTH_FULL[month]} (CSV)</span>
            <Arrow dir="down" />
          </button>
          <button onClick={exportYearJSON} disabled={busy === 'export'} className="tap flex w-full items-center justify-between rounded-xl bg-ink px-4 py-3 border border-line/60 disabled:opacity-50">
            <span className="text-sm font-medium text-white">{busy === 'export' ? 'Collecting…' : `Full-year backup (JSON)`}</span>
            <Arrow dir="down" />
          </button>
        </div>
      </section>

      {/* Import */}
      <section className="card p-4">
        <h2 className="text-sm font-semibold text-white">Import</h2>
        <p className="mt-1 text-xs text-slate-400">
          Loads data into the app and queues it to your Google Sheet. CSV fills the
          selected month; JSON restores the whole year.
        </p>
        <div className="mt-3 space-y-2">
          <button onClick={() => csvInput.current?.click()} disabled={busy === 'csv'} className="tap flex w-full items-center justify-between rounded-xl bg-ink px-4 py-3 border border-line/60 disabled:opacity-50">
            <span className="text-sm font-medium text-white">{busy === 'csv' ? 'Importing…' : `Import CSV into ${month}`}</span>
            <Arrow dir="up" />
          </button>
          <button onClick={() => jsonInput.current?.click()} disabled={busy === 'json'} className="tap flex w-full items-center justify-between rounded-xl bg-ink px-4 py-3 border border-line/60 disabled:opacity-50">
            <span className="text-sm font-medium text-white">{busy === 'json' ? 'Restoring…' : 'Restore backup (JSON)'}</span>
            <Arrow dir="up" />
          </button>
        </div>
        <input ref={csvInput} type="file" accept=".csv,text/csv" hidden onChange={(e) => importCSV(e.target.files?.[0])} />
        <input ref={jsonInput} type="file" accept=".json,application/json" hidden onChange={(e) => importJSON(e.target.files?.[0])} />
        <p className="mt-3 text-[11px] text-warn">
          Imports overwrite matching days. Derived totals (Total / Net) are
          recalculated, so only the input columns need to be present.
        </p>
      </section>
    </div>
  )
}

function Arrow({ dir }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-accent2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'down'
        ? <><path d="M12 4v12" /><path d="M6 12l6 6 6-6" /><path d="M5 20h14" /></>
        : <><path d="M12 20V8" /><path d="M6 12l6-6 6 6" /><path d="M5 4h14" /></>}
    </svg>
  )
}
