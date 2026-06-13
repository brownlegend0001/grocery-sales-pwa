import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { summariseMonth } from '../lib/calc.js'
import { rupee, rupeeCompact, pct } from '../lib/format.js'
import { MONTH_FULL } from '../lib/constants.js'
import MonthTabs from '../components/MonthTabs.jsx'
import KpiCard from '../components/KpiCard.jsx'
import DonutChart from '../components/DonutChart.jsx'
import BarChart from '../components/BarChart.jsx'

export default function Dashboard() {
  const { monthData, month, isConfigured } = useApp()
  const navigate = useNavigate()

  const s = useMemo(() => summariseMonth(monthData), [monthData])
  const bars = useMemo(
    () => monthData.map((d) => ({ value: d.totalSales, label: `${d.date}: ${rupee(d.totalSales)}`, date: d.date })),
    [monthData]
  )

  return (
    <div className="space-y-4">
      <MonthTabs />

      {!isConfigured && (
        <div className="card border-warn/40 bg-warn/5 p-3 text-xs text-warn">
          Not connected to Google Sheets yet — showing local data only.
          Add <code>VITE_SHEETS_API</code> in your <code>.env</code> (see README).
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Total Sales" value={rupeeCompact(s.totalSales)} sub={`${s.activeDays} active days`} accent="text-accent" icon="🛒" />
        <KpiCard label="Net Profit" value={rupeeCompact(s.netProfit)} sub={`Daily avg ${rupeeCompact(s.dailyAvg)}`} accent={s.netProfit >= 0 ? 'text-white' : 'text-danger'} icon="💰" />
        <KpiCard label="Expenses" value={rupeeCompact(s.expenses + s.toSuppliers)} sub={`Exp ${rupeeCompact(s.expenses)} · Sup ${rupeeCompact(s.toSuppliers)}`} accent="text-warn" icon="📦" />
        <KpiCard label="Salon" value={rupeeCompact(s.salon)} sub="Cash + Online" accent="text-accent2" icon="✂️" />
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Payment Split</h2>
        <DonutChart
          data={[
            { label: 'Cash', value: s.cash },
            { label: 'Online / UPI', value: s.online },
            { label: 'Card', value: s.card }
          ]}
        />
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <Split label="Cash" v={pct(s.cashPct)} />
          <Split label="Online" v={pct(s.onlinePct)} />
          <Split label="Card" v={pct(s.cardPct)} />
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Daily Sales · {MONTH_FULL[month]}</h2>
          <button onClick={() => navigate('/log')} className="tap text-xs font-medium text-accent2">View log →</button>
        </div>
        <BarChart data={bars} onBar={() => navigate('/log')} />
        <div className="mt-3 flex justify-between text-xs text-slate-400">
          <span>Best: <b className="text-accent">{s.bestDay ? `${s.bestDay.date} · ${rupeeCompact(s.bestDay.value)}` : '—'}</b></span>
          <span>Worst: <b className="text-warn">{s.worstDay ? `${s.worstDay.date} · ${rupeeCompact(s.worstDay.value)}` : '—'}</b></span>
        </div>
      </div>
    </div>
  )
}

function Split({ label, v }) {
  return (
    <div className="rounded-xl bg-card/60 py-2">
      <div className="text-base font-bold text-white tnum">{v}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  )
}
