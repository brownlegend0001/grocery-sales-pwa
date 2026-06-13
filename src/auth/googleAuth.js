import { GOOGLE_CLIENT_ID, IS_AUTH_ENABLED, SHEETS_API } from '../config.js'

// Google Sign-In + persistent device session.
//
// Flow:
//   1. User signs in with Google once → we get a short-lived ID token.
//   2. We exchange it at the backend `login` action for a 30-day SESSION token
//      (an HMAC signed by the Apps Script). That session is stored on the
//      device, so the app opens without Google on every launch — even offline.
//   3. Normal API calls send { session }. The backend validates the HMAC and
//      the allowed-email list; no Google round-trip, no hourly expiry.
//
// Back-compat: if the backend doesn't yet understand `login` (older Code.gs),
// we fall back to sending the raw { idToken } so nothing breaks during upgrade.

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const STORE_KEY = 'auth-session-v1'

let current = loadStored()   // { mode:'session'|'idToken', token, email, exp(ms) } | null
let wrongAccount = false
let ready = false
let gisInit = false
let scriptPromise = null
let pending = []
const listeners = new Set()

function loadStored() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY))
    if (s && s.token && s.exp > Date.now()) return s
  } catch (e) {}
  return null
}
function persist() {
  if (current) localStorage.setItem(STORE_KEY, JSON.stringify(current))
  else localStorage.removeItem(STORE_KEY)
}

const authParamsFor = (c) => (c.mode === 'session' ? { session: c.token } : { idToken: c.token })

export function snapshot() {
  return {
    enabled: IS_AUTH_ENABLED,
    ready: ready || !IS_AUTH_ENABLED,
    signedIn: !IS_AUTH_ENABLED || Boolean(current && current.exp > Date.now()),
    persistent: current?.mode === 'session',
    email: current?.email || null,
    wrongAccount
  }
}

export function subscribe(fn) {
  listeners.add(fn)
  fn(snapshot())
  return () => listeners.delete(fn)
}
function notify() {
  const s = snapshot()
  listeners.forEach((fn) => fn(s))
}

function decodeJwt(jwt) {
  const part = jwt.split('.')[1]
  const json = decodeURIComponent(
    atob(part.replace(/-/g, '+').replace(/_/g, '/'))
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  )
  return JSON.parse(json)
}

function loadScript() {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = GIS_SRC; s.async = true; s.defer = true
    s.onload = resolve
    s.onerror = () => { scriptPromise = null; reject(new Error('GIS load failed')) }
    document.head.appendChild(s)
  })
  return scriptPromise
}

async function ensureGis() {
  if (window.google?.accounts?.id && gisInit) return true
  try { await loadScript() } catch (e) { return false }
  if (!gisInit) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: true,
      use_fedcm_for_prompt: true,
      cancel_on_tap_outside: false
    })
    gisInit = true
  }
  return true
}

function resolvePending(val) {
  const list = pending; pending = []
  list.forEach((r) => r(val))
}

// Exchange a Google ID token for a long-lived device session.
async function exchange(idToken) {
  const res = await fetch(SHEETS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'login', idToken })
  })
  const data = await res.json().catch(() => ({ ok: false, error: 'Bad response' }))
  if (!data.ok) { const e = new Error(data.error || 'Login failed'); throw e }
  return data.result // { session, email, exp(seconds) }
}

async function handleCredential(resp) {
  const idToken = resp.credential
  let payload = {}
  try { payload = decodeJwt(idToken) } catch (e) {}
  try {
    const r = await exchange(idToken)
    current = { mode: 'session', token: r.session, email: r.email, exp: Number(r.exp) * 1000 }
    wrongAccount = false; persist(); resolvePending(authParamsFor(current)); notify()
  } catch (err) {
    const msg = String(err.message || '')
    if (/not authoriz/i.test(msg)) {
      wrongAccount = true; current = null; persist()
      try { window.google.accounts.id.disableAutoSelect() } catch (e) {}
      resolvePending(null); notify(); return
    }
    if (/unknown action|login/i.test(msg)) {
      // Older backend without session support — use the ID token directly.
      current = { mode: 'idToken', token: idToken, email: payload.email, exp: Number(payload.exp) * 1000 }
      wrongAccount = false; persist(); resolvePending(authParamsFor(current)); notify(); return
    }
    resolvePending(null) // network/other: leave state unchanged
  }
}

export async function initAuth() {
  if (!IS_AUTH_ENABLED) { ready = true; notify(); return }
  // A valid stored session means we're signed in instantly — even offline.
  if (current && current.exp > Date.now()) {
    ready = true; notify()
    ensureGis().catch(() => {})       // warm GIS in the background for later refresh
    return
  }
  const ok = await ensureGis()
  ready = true; notify()
  if (ok) { try { window.google.accounts.id.prompt() } catch (e) {} }
}

export function renderButton(el) {
  if (!el || !window.google?.accounts?.id) return
  el.innerHTML = ''
  window.google.accounts.id.renderButton(el, {
    theme: 'filled_blue', size: 'large', shape: 'pill',
    text: 'continue_with', logo_alignment: 'center', width: 280
  })
}

// Returns the auth params to attach to an API call, or null if not signed in.
export function getAuthParams() {
  if (!IS_AUTH_ENABLED) return Promise.resolve({})
  if (current && current.exp - Date.now() > 60_000) return Promise.resolve(authParamsFor(current))
  if (!navigator.onLine) return Promise.resolve(current && current.exp > Date.now() ? authParamsFor(current) : null)

  return (async () => {
    const ok = await ensureGis()
    if (!ok) return null
    return new Promise((resolve) => {
      pending.push(resolve)
      try { window.google.accounts.id.prompt() } catch (e) {}
      setTimeout(() => {
        const i = pending.indexOf(resolve)
        if (i >= 0) { pending.splice(i, 1); resolve(current && current.exp > Date.now() ? authParamsFor(current) : null) }
      }, 8000)
    })
  })()
}

export function signOut() {
  current = null; wrongAccount = false; persist()
  try { window.google?.accounts.id.disableAutoSelect() } catch (e) {}
  notify()
}
