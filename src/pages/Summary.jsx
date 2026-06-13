import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { MONTHS } from '../lib/constants.js'
import { rupee, rupeeCompact, pct } from '../lib/format.js'
import KpiCard from '../components/KpiCard.jsx'
import BarChart from '../components/BarChart.jsx'
import DonutChart from '../components/DonutChart.jsx'

// Whole-year performance — the annual rollup across all 12 month tabs.
export default function Summary() {
  const { summary, YEAR, setMonthIndex, isConfigured } = useApp()
  const navigate = useNavigate()

  const months = summary?.months || []
  const yt = summary?.yearTotal || null

  const bars = useMemo(
    () => months.map((m, i) => ({
      value: m.totalSales,
      label: `${m.month}: ${rupee(m.totalSales)}`,
      idx: i
    })),
    [months]
  )

  const best = useMemo(() => {
    let b = null
    for (const m of months) if (m.totalSales > 0 && (!b || m.totalSales > b.totalSales)) b = m
    return b
  }, [months])

  const openMonth = (i) => { setMonthIndex(i); navigate('/') }

  if (!summary) {
    return (
      <div className="space-y-4">
        <Header year={YEAR} />
        <div className="card p-6 text-center text-sm text-slate-400">
          {isConfigured
            ? 'Loading year summary… (pull data by opening a month, or check your connection)'
            : 'Connect to Google Sheets to see the annual summary.'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Header year={YEAR} />

      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Year Sales" value={rupeeCompact(yt.totalSales)} sub="all 12 months" accent="text-accent" icon="📈" />
        <KpiCard label="Net Profit" value={rupeeCompact(yt.netProfit)} sub={`Salon ${rupeeCompact(yt.salon)}`} accent={yt.netProfit >= 0 ? 'text-white' : 'text-danger'} icon="💰" />
        <KpiCard label="Expenses" value={rupeeCompact(yt.expenses + yt.toSuppliers)} sub={`Exp ${rupeeCompact(yt.expenses)} · Sup ${rupeeCompact(yt.toSuppliers)}`} accent="text-warn" icon="📦" />
        <KpiCard label="Best Month" value={best ? best.month : '—'} sub={best ? rupeeCompact(best.totalSales) : ''} accent="text-accent2" icon="🏆" />
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Monthly Sales · {YEAR}</h2>
        <BarChart data={bars} onBar={(d) => openMonth(d.idx)} />
        <div className="mt-2 flex justify-between gap-[3px]">
          {MONTHS.map((m, i) => (
            <button key={m} onClick={() => openMonth(i)} className="flex-1 text-[9px] text-slate-500">
              {m[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Payment Split · Year</h2>
        <DonutChart
          data={[
            { label: 'Cash', value: yt.cash },
            { label: 'Online / UPI', value: yt.online },
            { label: 'Card', value: yt.card }
          ]}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 gap-1 border-b border-line/60 px-3 py-2 text-[10px] uppercase tracking-wide text-slate-400">
          <span className="col-span-3">Month</span>
          <span className="col-span-4 text-right">Sales</span>
          <span className="col-span-5 text-right">Net Profit</span>
        </div>
        {months.map((m, i) => {
          const empty = m.totalSales === 0 && m.netProfit === 0
          return (
            <button
              key={m.month}
              onClick={() => openMonth(i)}
              className="tap grid w-full grid-cols-12 items-center gap-1 border-b border-line/40 px-3 py-2.5 text-left active:bg-card/60 last:border-0"
            >
              <span className="col-span-3 text-sm font-semibold text-white">{m.month}</span>
              <span className={`col-span-4 text-right text-sm tnum ${empty ? 'text-slate-600' : 'text-slate-200'}`}>
                {empty ? '—' : rupee(m.totalSales)}
              </span>
              <span className={`col-span-5 text-right text-sm font-medium tnum ${empty ? 'text-slate-600' : m.netProfit < 0 ? 'text-danger' : 'text-accent'}`}>
                {empty ? '' : rupee(m.netProfit)}
              </span>
            </button>
          )
        })}
        {yt && (
          <div className="grid grid-cols-12 items-center gap-1 bg-card/70 px-3 py-3">
            <span className="col-span-3 text-sm font-bold text-white">YEAR</span>
            <span className="col-span-4 text-right text-sm font-bold text-white tnum">{rupee(yt.totalSales)}</span>
            <span className={`col-span-5 text-right text-sm font-bold tnum ${yt.netProfit < 0 ? 'text-danger' : 'text-accent'}`}>{rupee(yt.netProfit)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Header({ year }) {
  return (
    <div className="flex items-baseline justify-between px-1">
      <h1 className="text-lg font-bold text-white">{year} Performance</h1>
      <span className="text-xs text-slate-400">Annual summary</span>
    </div>
  )
}
