export default function KpiCard({ label, value, sub, accent = 'text-white', icon }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <div className={`mt-2 text-2xl font-bold tnum ${accent}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400 tnum">{sub}</div>}
    </div>
  )
}
