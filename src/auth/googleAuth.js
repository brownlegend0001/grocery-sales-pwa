import { GOOGLE_CLIENT_ID, ALLOWED_EMAIL, IS_AUTH_ENABLED } from '../config.js'

// Google Identity Services (GIS) wrapper.
//
// Flow: GIS issues a signed JWT *ID token* for the signed-in Google account.
// We decode it locally only to read email + expiry; the real verification
// happens server-side in Code.gs (which rejects any token whose email isn't
// ALLOWED_EMAIL). Nothing here is a secret — the client_id is public.
//
// Offline: a previously-signed-in user can still open the app and view cached
// data / queue edits. Those edits only reach the Sheet once back online AND a
// fresh ID token is presented, so confidentiality is preserved either way.

const GIS_SRC = 'https://accounts.google.com/gsi/client'
const EMAIL_KEY = 'auth-email'

let current = null          // { token, email, exp(ms) }
let wrongAccount = false
let ready = false
let offlineOk = false
let gisInitialised = false
let scriptPromise = null
let pending = []
const listeners = new Set()

const lc = (s) => String(s || '').toLowerCase()

export function snapshot() {
  return {
    enabled: IS_AUTH_ENABLED,
    ready: ready || !IS_AUTH_ENABLED,
    signedIn:
      !IS_AUTH_ENABLED ||
      Boolean(current && current.exp > Date.now()) ||
      offlineOk,
    online: navigator.onLine && Boolean(window.google?.accounts?.id),
    email: current?.email || (offlineOk ? localStorage.getItem(EMAIL_KEY) : null),
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
    s.src = GIS_SRC
    s.async = true
    s.defer = true
    s.onload = resolve
    s.onerror = () => { scriptPromise = null; reject(new Error('GIS load failed')) }
    document.head.appendChild(s)
  })
  return scriptPromise
}

function resolvePending(val) {
  const list = pending
  pending = []
  list.forEach((r) => r(val))
}

function handleCredential(resp) {
  try {
    const payload = decodeJwt(resp.credential)
    if (lc(payload.email) !== lc(ALLOWED_EMAIL)) {
      // Signed in, but not the authorised account — refuse.
      wrongAccount = true
      current = null
      try { window.google.accounts.id.disableAutoSelect() } catch (e) {}
      resolvePending(null)
      notify()
      return
    }
    wrongAccount = false
    offlineOk = false
    current = { token: resp.credential, email: payload.email, exp: Number(payload.exp) * 1000 }
    localStorage.setItem(EMAIL_KEY, payload.email)
    resolvePending(current.token)
    notify()
  } catch (e) {
    resolvePending(null)
  }
}

// Load + initialise GIS exactly once. Returns false when offline/blocked.
async function ensureGis() {
  if (window.google?.accounts?.id && gisInitialised) return true
  try {
    await loadScript()
  } catch (e) {
    return false
  }
  if (!gisInitialised) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: true,
      use_fedcm_for_prompt: true,
      cancel_on_tap_outside: false
    })
    gisInitialised = true
  }
  return true
}

// Called once on app start.
export async function initAuth() {
  if (!IS_AUTH_ENABLED) { ready = true; notify(); return }
  const ok = await ensureGis()
  if (!ok) {
    // Offline / GIS blocked: allow cached-only access for a returning user.
    offlineOk = lc(localStorage.getItem(EMAIL_KEY)) === lc(ALLOWED_EMAIL)
    ready = true
    notify()
    return
  }
  ready = true
  notify()
  try { window.google.accounts.id.prompt() } catch (e) {}
}

// Render the official Google button into a container element.
export function renderButton(el) {
  if (!el || !window.google?.accounts?.id) return
  el.innerHTML = ''
  window.google.accounts.id.renderButton(el, {
    theme: 'filled_blue',
    size: 'large',
    shape: 'pill',
    text: 'continue_with',
    logo_alignment: 'center',
    width: 280
  })
}

// Returns a valid ID token, or null. Used by the API layer before every call.
export function getIdToken() {
  if (!IS_AUTH_ENABLED) return Promise.resolve(null)
  if (current && current.exp - Date.now() > 60_000) return Promise.resolve(current.token)
  if (!navigator.onLine) return Promise.resolve(null)

  return (async () => {
    const ok = await ensureGis()
    if (!ok) return null
    return new Promise((resolve) => {
      pending.push(resolve)
      try { window.google.accounts.id.prompt() } catch (e) {}
      // Fail open to null after a short wait so writes simply stay queued.
      setTimeout(() => {
        const i = pending.indexOf(resolve)
        if (i >= 0) {
          pending.splice(i, 1)
          resolve(current && current.exp > Date.now() ? current.token : null)
        }
      }, 8000)
    })
  })()
}

export function signOut() {
  current = null
  offlineOk = false
  wrongAccount = false
  localStorage.removeItem(EMAIL_KEY)
  try { window.google?.accounts.id.disableAutoSelect() } catch (e) {}
  notify()
}

export { ALLOWED_EMAIL }
