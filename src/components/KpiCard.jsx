const TINTS = {
  'text-accent':  'from-emerald-400/25 to-emerald-500/5 text-accent',
  'text-accent2': 'from-sky-400/25 to-sky-500/5 text-accent2',
  'text-warn':    'from-amber-300/25 to-amber-500/5 text-warn',
  'text-danger':  'from-rose-400/25 to-rose-500/5 text-danger',
  'text-white':   'from-white/15 to-white/0 text-white'
}

export default function KpiCard({ label, value, sub, accent = 'text-white', icon }) {
  const tint = TINTS[accent] || TINTS['text-white']
  return (
    <div className="card relative overflow-hidden p-4 animate-rise">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {icon && (
          <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${tint} text-lg`}>
            {icon}
          </span>
        )}
      </div>
      <div className={`mt-3 text-[26px] font-extrabold leading-none tracking-tight tnum ${accent}`}>{value}</div>
      {sub && <div className="mt-1.5 text-[11px] text-slate-400 tnum">{sub}</div>}
    </div>
  )
}
