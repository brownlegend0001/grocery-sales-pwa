import { useMemo, useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { INPUT_FIELDS, MONTHS, MONTH_FULL } from '../lib/constants.js'
import { deriveDay } from '../lib/calc.js'
import { rupee, weekdayFor, todayParts, daysInMonth } from '../lib/format.js'
import MonthTabs from '../components/MonthTabs.jsx'

const GROUPS = [
  { id: 'shop', title: 'Shop Sales', tint: 'text-accent' },
  { id: 'salon', title: 'Salon', tint: 'text-accent2' },
  { id: 'out', title: 'Outgoing', tint: 'text-warn' }
]

export default function Entry() {
  const { monthIndex, month, YEAR, monthData, updateDay } = useApp()

  // Default to today if we're viewing the current month, else day 1.
  const t = todayParts()
  const defaultDay = t.year === YEAR && t.monthIndex === monthIndex ? t.day : 1
  const [day, setDay] = useState(defaultDay)
  const [form, setForm] = useState({})
  const [saved, setSaved] = useState(false)

  // Whenever the selected day/month changes, load existing values into the form.
  useEffect(() => {
    const rec = monthData.find((d) => d.date === day) || {}
    const next = {}
    for (const f of INPUT_FIELDS) next[f.key] = rec[f.key] ? String(rec[f.key]) : ''
    setForm(next)
    setSaved(false)
  }, [day, month, monthData])

  // Reset the chosen day when switching months.
  useEffect(() => { setDay(defaultDay) }, [monthIndex]) // eslint-disable-line

  const derived = useMemo(() => deriveDay(form), [form])
  const weekday = weekdayFor(YEAR, monthIndex, day)
  const nDays = daysInMonth(YEAR, monthIndex)

  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v.replace(/[^0-9.]/g, '') }))
    setSaved(false)
  }

  const save = () => {
    const values = {}
    for (const f of INPUT_FIELDS) values[f.key] = form[f.key] === '' ? 0 : Number(form[f.key])
    updateDay(day, values)
    setSaved(true)
    if (navigator.vibrate) navigator.vibrate(12)
  }

  return (
    <div className="space-y-4">
      <MonthTabs />

      {/* Day selector */}
      <div className="card p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-slate-400">Day</span>
          <span className="text-xs font-medium text-slate-300">{weekday} · {MONTH_FULL[month]} {day}</span>
        </div>
        <div className="no-scrollbar -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 py-1">
          {Array.from({ length: nDays }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => setDay(d)}
              data-active={d === day}
              className={`tap grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-semibold ${
                d === day ? 'bg-accent text-ink' : 'bg-card text-slate-300 border border-line/60'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Input groups */}
      {GROUPS.map((g) => (
        <div key={g.id} className="card p-4">
          <h3 className={`mb-3 text-sm font-semibold ${g.tint}`}>{g.title}</h3>
          <div className="space-y-2.5">
            {INPUT_FIELDS.filter((f) => f.group === g.id).map((f) => (
              <label key={f.key} className="flex items-center gap-3">
                <span className="flex-1 text-sm text-slate-300">{f.label}</span>
                <div className="flex items-center rounded-xl bg-ink px-3 py-2.5 border border-line/60 focus-within:border-accent/70">
                  <span className="mr-1 text-slate-500">₹</span>
                  <input
                    inputMode="decimal"
                    enterKeyHint="next"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder="0"
                    className="w-28 bg-transparent text-right font-semibold text-white outline-none tnum placeholder:text-slate-600"
                  />
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Live computed totals */}
      <div className="card p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Total label="Total Sales" value={rupee(derived.totalSales)} accent="text-accent" />
          <Total label="Salon Total" value={rupee(derived.salonTotal)} accent="text-accent2" />
          <Total label="Net Profit" value={rupee(derived.netProfit)} accent={derived.netProfit >= 0 ? 'text-white' : 'text-danger'} big />
        </div>
      </div>

      {/* Sticky save bar above the home indicator */}
      <div className="sticky bottom-0 -mx-4 px-4 pt-1">
        <button
          onClick={save}
          className={`tap w-full rounded-2xl py-4 text-base font-bold shadow-card ${
            saved ? 'bg-accent/20 text-accent' : 'bg-accent text-ink'
          }`}
        >
          {saved ? '✓ Saved' : `Save ${MONTHS[monthIndex]} ${day}`}
        </button>
      </div>
    </div>
  )
}

function Total({ label, value, accent, big }) {
  return (
    <div className={big ? 'col-span-2 rounded-xl bg-card/60 p-3' : ''}>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`font-bold tnum ${big ? 'text-2xl' : 'text-lg'} ${accent}`}>{value}</div>
    </div>
  )
}
