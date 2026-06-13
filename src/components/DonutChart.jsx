// Dependency-free donut for the payment split (Cash / Online / Card).
const COLORS = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa']

export default function DonutChart({ data = [], size = 150, stroke = 22 }) {
  const total = data.reduce((a, d) => a + (d.value || 0), 0)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        {total > 0 && data.map((d, i) => {
          const frac = (d.value || 0) / total
          const dash = frac * c
          const seg = (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          )
          offset += dash
          return seg
        })}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-slate-300">{d.label}</span>
            <span className="ml-auto font-semibold tnum text-white">
              {total > 0 ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
