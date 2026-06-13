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
  )
}

const items = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/entry', label: 'Entry', icon: 'entry' },
  { to: '/log', label: 'Log', icon: 'log' },
  { to: '/data', label: 'Data', icon: 'data' }
]

export default function BottomNav() {
  return (
    <nav
      className="border-t border-line/60 bg-panel/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `tap flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                isActive ? 'text-accent' : 'text-slate-400'
              }`
            }
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
              {ICONS[it.icon]}
            </svg>
            {it.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
