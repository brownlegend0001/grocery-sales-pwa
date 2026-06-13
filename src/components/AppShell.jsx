import { Outlet } from 'react-router-dom'
import SyncPill from './SyncPill.jsx'
import BottomNav from './BottomNav.jsx'
import InstallPrompt from './InstallPrompt.jsx'
import { useApp } from '../context/AppContext.jsx'
import { MONTH_FULL } from '../lib/constants.js'
import { IS_AUTH_ENABLED } from '../config.js'
import { signOut } from '../auth/googleAuth.js'

// Fixed header + footer, single scrollable content region in the middle.
// The whole frame respects the iPhone safe areas (notch + home indicator).
export default function AppShell() {
  const { month, YEAR } = useApp()

  return (
    <div className="flex h-[100dvh] flex-col bg-ink">
      <header
        className="shrink-0 border-b border-white/10 bg-panel/70 px-4 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-lg shadow-glow-sm">🛒</span>
            <div>
              <h1 className="text-[17px] font-extrabold leading-tight tracking-tight text-grad">
                {MONTH_FULL[month]} {YEAR}
              </h1>
              <p className="text-[11px] text-slate-400">Daily Sales Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SyncPill />
            {IS_AUTH_ENABLED && (
              <button
                onClick={() => { if (confirm('Sign out of this device?')) signOut() }}
                aria-label="Sign out"
                className="tap grid h-8 w-8 place-items-center rounded-full border border-line/60 bg-card text-slate-400"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-md px-4 pb-6 pt-3">
          <Outlet />
        </div>
      </main>

      <footer className="shrink-0">
        <BottomNav />
      </footer>

      <InstallPrompt />
    </div>
  )
}
