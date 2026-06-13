import { useEffect, useState } from 'react'

// True when the PWA is running from the Home Screen (iOS standalone) or any
// display-mode: standalone context. Used to decide whether to show the
// "Add to Home Screen" tutorial.
function check() {
  const iosStandalone = window.navigator.standalone === true
  const mq = window.matchMedia?.('(display-mode: standalone)').matches
  return Boolean(iosStandalone || mq)
}

// Rough iOS Safari detection (iPhone/iPad, not in-app webviews like FB/IG).
export function isIOSSafari() {
  const ua = window.navigator.userAgent
  const iOS = /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const webkit = /WebKit/.test(ua)
  const notOtherBrowser = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  return iOS && webkit && notOtherBrowser
}

export function useStandalone() {
  const [standalone, setStandalone] = useState(check())
  useEffect(() => {
    const mq = window.matchMedia?.('(display-mode: standalone)')
    const handler = () => setStandalone(check())
    mq?.addEventListener?.('change', handler)
    return () => mq?.removeEventListener?.('change', handler)
  }, [])
  return standalone
}
