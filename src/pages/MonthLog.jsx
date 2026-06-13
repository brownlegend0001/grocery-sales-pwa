import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { INPUT_FIELDS, MONTH_FULL } from '../lib/constants.js'
import { deriveDay } from '../lib/calc.js'
import { rupee, rupeeCompact } from '../lib/format.js'
import MonthTabs from '../components/MonthTabs.jsx'

export default function MonthLog() {
  const { monthData, month, updateDay, removeDay } = useApp()
  const [editing, setEditing] = useState(null) // day record or null

  const rows = useMemo(() => monthData.map(deriveDay), [monthData])
  const filled = rows.filter((r) => r.totalSales || r.salonTotal || r.expenses || r.toSuppliers)
  const grand = filled.reduce((a, r) => a + r.netProfit, 0)

  return (
    <div className="space-y-4">
      <MonthTabs />

      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-white">{MONTH_FULL[month]} · {filled.length} entries</h2>
        <span className="text-xs text-slate-400">Net <b className="text-accent tnum">{rupeeCompact(grand)}</b></span>
      </div>

      <div className="card divide-y divide-line/50 overflow-hidden">
        {rows.map((r) => {
          const empty = !(r.totalSales || r.salonTotal || r.expenses || r.toSuppliers)
          return (
            <button
              key={r.date}
              onClick={() => setEditing(r)}
              className="tap flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-card/60"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-center">
                <span className="text-[15px] font-bold leading-none text-white tnum">{r.date}</span>
                <span className="text-[9px] uppercase text-slate-500">{r.weekday}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className={`font-semibold tnum ${empty ? 'text-slate-600' : 'text-white'}`}>
                    {empty ? 'No entry' : rupee(r.totalSales)}
                  </span>
                  <span className={`text-sm font-medium tnum ${r.netProfit < 0 ? 'text-danger' : 'text-accent'}`}>
                    {empty ? '' : rupee(r.netProfit)}
                  </span>
                </div>
                {!empty && (
                  <div className="mt-0.5 flex gap-2 text-[11px] text-slate-400 tnum">
                    <span>💵 {rupeeCompact(r.cash)}</span>
                    <span>📱 {rupeeCompact(r.online)}</span>
                    <span>💳 {rupeeCompact(r.card)}</span>
                    {r.salonTotal > 0 && <span className="text-accent2">✂️ {rupeeCompact(r.salonTotal)}</span>}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {editing && (
        <EditSheet
          record={editing}
          month={month}
          onClose={() => setEditing(null)}
          onSave={(values) => { updateDay(editing.date, values); setEditing(null) }}
          onDelete={() => { removeDay(editing.date); setEditing(null) }}
        />
      )}
    </div>
  )
}

function EditSheet({ record, month, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => {
    const f = {}
    for (const x of INPUT_FIELDS) f[x.key] = record[x.key] ? String(record[x.key]) : ''
    return f
  })
  const derived = deriveDay(form)
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v.replace(/[^0-9.]/g, '') }))

  const save = () => {
    const values = {}
    for (const f of INPUT_FIELDS) values[f.key] = form[f.key] === '' ? 0 : Number(form[f.key])
    onSave(values)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="card max-h-[88dvh] w-full overflow-y-auto rounded-b-none p-4"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">
            Edit · {month} {record.date} <span className="text-slate-400">({record.weekday})</span>
          </h3>
          <button onClick={onClose} className="tap px-2 text-slate-400">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {INPUT_FIELDS.map((f) => (
            <label key={f.key} className="rounded-xl bg-ink p-2.5 border border-line/60 focus-within:border-accent/70">
              <span className="block text-[11px] text-slate-400">{f.label}</span>
              <div className="flex items-center">
                <span className="mr-1 text-slate-500">₹</span>
                <input
                  inputMode="decimal"
                  value={form[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent font-semibold text-white outline-none tnum placeholder:text-slate-600"
                />
              </div>
            </label>
          ))}
        </div>

        <div className="mt-3 flex justify-between rounded-xl bg-card/60 px-3 py-2 text-sm">
          <span className="text-slate-300">Total <b className="text-accent tnum">{rupee(derived.totalSales)}</b></span>
          <span className="text-slate-300">Net <b className={`tnum ${derived.netProfit < 0 ? 'text-danger' : 'text-white'}`}>{rupee(derived.netProfit)}</b></span>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onDelete} className="tap rounded-xl bg-danger/15 px-4 py-3 text-sm font-semibold text-danger border border-danger/30">
            Delete
          </button>
          <button onClick={save} className="tap flex-1 rounded-xl bg-accent py-3 text-sm font-bold text-ink">
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
