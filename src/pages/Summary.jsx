import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { MONTHS } from '../lib/constants.js'
import { rupee, rupeeCompact } from '../lib/format.js'
import KpiCard from '../components/KpiCard.jsx'
import BarChart from '../components/BarChart.jsx'
import DonutChart from '../components/DonutChart.jsx'

// Whole-year performance — the annual rollup across all 12 month tabs.
export default function Summary() {
  const { summary, YEAR, setMonthIndex, isConfigured, buildYear } = useApp()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(!summary)

  // Build/refresh the year rollup whenever this tab is opened.
  useEffect(() => {
    let alive = true
    setLoading(!summary)
    buildYear().finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        <Header year={YEAR} loading={loading} onRefresh={() => buildYear({ force: true })} />
        <div className="card flex flex-col items-center gap-3 p-8 text-center text-sm text-slate-400">
          {isConfigured ? (
            <>
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
              Crunching all 12 months…
            </>
          ) : (
            'Connect to Google Sheets to see the annual summary.'
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Header year={YEAR} loading={loading} onRefresh={() => buildYear({ force: true })} />

      {summary.error && (
        <div className="card border-warn/40 bg-warn/5 p-3 text-xs text-warn">
          Some months couldn’t load ({summary.okCount}/12 read). Last error:
          <span className="block font-mono text-[11px] text-warn/90">{summary.error}</span>
        </div>
      )}

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

      <p className="pt-1 text-center text-[10px] text-slate-600">
        year-rollup build YR-3 · {summary.okCount ?? 0}/12 months read
      </p>
    </div>
  )
}

function Header({ year, loading, onRefresh }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h1 className="text-lg font-bold text-white">{year} Performance</h1>
      <button onClick={onRefresh} className="tap flex items-center gap-1.5 rounded-full border border-white/10 bg-card px-3 py-1 text-xs font-medium text-slate-300">
        <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 fill-none stroke-accent ${loading ? 'animate-spin' : ''}`} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
        </svg>
        {loading ? 'Syncing' : 'Refresh'}
      </button>
    </div>
  )
}
