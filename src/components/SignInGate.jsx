import { useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { renderButton, signOut, ALLOWED_EMAIL } from '../auth/googleAuth.js'

// Wraps the whole app. Renders children only once signed in as the authorised
// account. When auth is disabled (no client id configured) it's a pass-through.
export default function SignInGate({ children }) {
  const auth = useAuth()
  const btnRef = useRef(null)

  useEffect(() => {
    if (auth.ready && !auth.signedIn && btnRef.current) renderButton(btnRef.current)
  }, [auth.ready, auth.signedIn, auth.wrongAccount])

  if (!auth.enabled) return children
  if (!auth.ready) return <Splash label="Starting…" />
  if (auth.signedIn) return children

  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center justify-center bg-ink px-6 text-center"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-3xl">🛒</div>
      <h1 className="mt-5 text-xl font-bold text-white">Grocery Sales</h1>
      <p className="mt-1 text-sm text-slate-400">Confidential — authorised account only</p>

      {auth.wrongAccount && (
        <div className="mt-5 w-full max-w-xs rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          That Google account isn’t allowed. This app is locked to
          <span className="block font-semibold break-all">{ALLOWED_EMAIL}</span>
          <button onClick={signOut} className="tap mt-2 text-xs font-medium text-slate-300 underline">
            Use a different account
          </button>
        </div>
      )}

      <div className="mt-7 flex justify-center" ref={btnRef} />

      {!navigator.onLine && (
        <p className="mt-6 max-w-xs text-xs text-warn">
          You’re offline. Connect to the internet once to sign in — after that the
          app works offline.
        </p>
      )}

      <p className="mt-8 max-w-xs text-[11px] leading-relaxed text-slate-500">
        Your sign-in is verified on Google’s servers before any sheet data is
        read or written.
      </p>
    </div>
  )
}

function Splash({ label }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-ink">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  )
}
