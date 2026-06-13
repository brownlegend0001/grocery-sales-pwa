import { NavLink } from 'react-router-dom'

const ICONS = {
  dashboard: (
    <path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm9 0h7v-9h-7v9zm0-16v5h7V4h-7z" />
  ),
  entry: (
    <path d="M12 5v14m-7-7h14" strokeWidth="2.2" stroke="currentColor" fill="none" strokeLinecap="round" />
  ),
  log: (
    <path d="M4 6h16M4 12h16M4 18h10" strokeWidth="2.2" stroke="currentColor" fill="none" strokeLinecap="round" />
  ),
  data: (
    <path d="M8 17l-4-4 4-4M16 7l4 4-4 4M4 13h10M10 11h10" strokeWidth="2.2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  ),
  year: (
    <g strokeWidth="2.2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h16" />
      <path d="M7 20v-6M12 20V7M17 20v-9" />
    </g>
  )
}

const items = [
  { to: '/', label: 'Month', icon: 'dashboard', end: true },
  { to: '/year', label: 'Year', icon: 'year' },
  { to: '/entry', label: 'Entry', icon: 'entry' },
  { to: '/log', label: 'Log', icon: 'log' },
  { to: '/data', label: 'Data', icon: 'data' }
]

export default function BottomNav() {
  return (
    <nav
      className="border-t border-white/10 bg-panel/80 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `tap relative flex flex-1 flex-col items-center gap-1 pb-2 pt-2.5 text-[10px] font-semibold ${
                isActive ? 'text-accent' : 'text-slate-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`absolute top-0 h-[3px] w-8 rounded-full bg-accent transition-opacity ${isActive ? 'opacity-100 shadow-glow-sm' : 'opacity-0'}`} />
                <span className={`grid h-7 w-7 place-items-center rounded-xl transition-colors ${isActive ? 'bg-accent/15' : ''}`}>
                  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-current">
                    {ICONS[it.icon]}
                  </svg>
                </span>
                {it.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
