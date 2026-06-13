// Runtime configuration (injected at build time from your .env file).
// Vite only exposes vars prefixed with VITE_. None of these are secrets:
// the Apps Script URL points at your Web App, and the Google client id is
// public by design. The real gate is server-side ID-token verification.

export const SHEETS_API = import.meta.env.VITE_SHEETS_API || ''
export const YEAR = Number(import.meta.env.VITE_YEAR || 2026)

// Google Sign-In. When VITE_GOOGLE_CLIENT_ID is set the app is gated behind
// Google auth and only ALLOWED_EMAIL may use it.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
export const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL || 'brownlegend0001@gmail.com'

export const IS_CONFIGURED = Boolean(SHEETS_API)
export const IS_AUTH_ENABLED = Boolean(GOOGLE_CLIENT_ID)
