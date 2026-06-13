import { useRef, useEffect } from 'react'
import { MONTHS } from '../lib/constants.js'
import { useApp } from '../context/AppContext.jsx'

// Horizontal, swipeable month selector mirroring the Google Sheet tabs.
export default function MonthTabs() {
  const { monthIndex, setMonthIndex } = useApp()
  const ref = useRef(null)

  // Keep the active tab scrolled into view.
  useEffect(() => {
    const el = ref.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [monthIndex])

  return (
    <div ref={ref} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2">
      {MONTHS.map((m, i) => {
        const active = i === monthIndex
        return (
          <button
            key={m}
            data-active={active}
            onClick={() => setMonthIndex(i)}
            className={`tap shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold ${
              active ? 'bg-brand text-ink shadow-glow-sm' : 'bg-card text-slate-300 border border-white/10'
            }`}
          >
            {m}
          </button>
        )
      })}
    </div>
  )
}
