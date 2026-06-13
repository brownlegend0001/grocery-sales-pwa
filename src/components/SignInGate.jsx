import { useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { renderButton, signOut } from '../auth/googleAuth.js'

// Wraps the whole app. Renders children only once signed in. A stored device
// session keeps you signed in across launches, so this screen normally appears
// just once. When auth is disabled (no client id) it's a pass-through.
export default function SignInGate({ children }) {
  const auth = useAuth()
  const btnRef = useRef(null)

  useEffect(() => {
    if (auth.ready && !auth.signedIn && btnRef.current) renderButton(btnRef.current)
  }, [auth.ready, auth.signedIn, auth.wrongAccount])

  if (!auth.enabled) return children
  if (!auth.ready) return <Splash />
  if (auth.signedIn) return children

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-ink px-6 text-center"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/20 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent2/10 blur-[90px]" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-gradient-to-br from-accent to-emerald-600 text-4xl shadow-glow">
          🛒
        </div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-white">Grocery Sales</h1>
        <p className="mt-1.5 text-sm text-slate-400">Confidential · authorised accounts only</p>

        {auth.wrongAccount && (
          <div className="mt-6 w-full max-w-xs rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            That Google account isn’t on the allow-list.
            <button onClick={signOut} className="tap mt-2 block w-full text-xs font-semibold text-slate-200 underline">
              Try a different account
            </button>
          </div>
        )}

        <div className="mt-8 flex justify-center" ref={btnRef} />

        {!navigator.onLine && (
          <p className="mt-6 max-w-xs text-xs text-warn">
            You’re offline — connect once to sign in. After that the app opens
            without signing in again.
          </p>
        )}

        <p className="mt-10 max-w-[15rem] text-[11px] leading-relaxed text-slate-500">
          Verified on Google’s servers. Stay signed in for 30 days on this device.
        </p>
      </div>
    </div>
  )
}

function Splash() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-ink">
      <div className="grid h-16 w-16 animate-pulse place-items-center rounded-3xl bg-gradient-to-br from-accent to-emerald-600 text-3xl shadow-glow">🛒</div>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-card">
        <div className="h-full w-1/2 animate-[slide_1.1s_ease-in-out_infinite] rounded-full bg-accent" />
      </div>
      <style>{`@keyframes slide{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
    </div>
  )
}
