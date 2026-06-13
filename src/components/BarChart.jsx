// Dependency-free vertical bar chart for daily sales across the month.
export default function BarChart({ data = [], height = 132, color = '#22c55e', onBar }) {
  const max = Math.max(1, ...data.map((d) => d.value || 0))
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(2, ((d.value || 0) / max) * height)
        return (
          <button
            key={i}
            onClick={() => onBar?.(d)}
            title={d.label}
            className="tap group relative flex-1 rounded-t-sm"
            style={{ height: h, background: d.value ? color : '#334155', minWidth: 3 }}
          />
        )
      })}
    </div>
  )
}
