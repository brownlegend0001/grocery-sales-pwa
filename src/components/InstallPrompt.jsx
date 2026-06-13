import { useEffect, useState } from 'react'
import { useStandalone, isIOSSafari } from '../hooks/useStandalone.js'

const DISMISS_KEY = 'a2hs-dismissed-v1'

// iOS Safari has no beforeinstallprompt event, so we coach the user to use the
// Share sheet. Shown only in Safari, only when not already installed, and only
// until dismissed once.
export default function InstallPrompt() {
  const standalone = useStandalone()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (standalone) return
    if (!isIOSSafari()) return
    if (localStorage.getItem(DISMISS_KEY)) return
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [standalone])

  if (!show) return null

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setShow(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
         style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
      <div className="card w-full max-w-md p-5 animate-[slideUp_.25s_ease]">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent text-xl">📲</div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">Install this app</h3>
            <p className="mt-1 text-sm text-slate-300">
              Add Sales to your Home Screen for full-screen, offline access.
            </p>
          </div>
          <button onClick={dismiss} className="tap -mr-1 -mt-1 px-2 text-slate-400">✕</button>
        </div>

        <ol className="mt-4 space-y-2 text-sm text-slate-200">
          <li className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-card text-xs text-slate-400 border border-line">1</span>
            Tap the <ShareGlyph /> <b>Share</b> button below
          </li>
          <li className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-card text-xs text-slate-400 border border-line">2</span>
            Choose <b>Add to Home Screen</b> <span className="text-slate-400">⊞</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-card text-xs text-slate-400 border border-line">3</span>
            Tap <b>Add</b> — then open it from your Home Screen
          </li>
        </ol>

        <button onClick={dismiss} className="tap mt-4 w-full rounded-xl bg-card py-3 text-sm font-semibold text-slate-200 border border-line/60">
          Got it
        </button>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  )
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="inline h-5 w-5 fill-none stroke-accent2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
    </svg>
  )
}
