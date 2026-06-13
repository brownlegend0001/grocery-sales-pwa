import { SHEETS_API, IS_AUTH_ENABLED } from '../config.js'
import { getAuthParams } from '../auth/googleAuth.js'

// All network access to the Google Sheet goes through the Apps Script Web App.
// We POST with Content-Type: text/plain to stay a "simple request" and avoid a
// CORS preflight that Apps Script can't answer. Every call carries a signed
// Google ID token, which Code.gs verifies and locks to the authorised email.

class ApiError extends Error {}

async function call(action, payload = {}) {
  if (!SHEETS_API) throw new ApiError('Sheets API URL not configured')

  const auth = await getAuthParams()
  if (IS_AUTH_ENABLED && !auth) throw new ApiError('Sign-in required')

  const res = await fetch(SHEETS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...(auth || {}), ...payload })
  })

  if (!res.ok) throw new ApiError(`HTTP ${res.status}`)
  const data = await res.json()
  if (!data.ok) throw new ApiError(data.error || 'Request failed')
  return data.result
}

// Fetch one month's day records (array of day objects).
export const fetchMonth = (month) => call('getMonth', { month })

// Fetch the rolled-up summary for all 12 months.
export const fetchSummary = () => call('getSummary')

// Upsert a single day's input values. The Apps Script recomputes the derived
// columns and writes them too, so the Sheet stays correct even without formulas.
export const saveDay = (month, day, values) =>
  call('saveDay', { month, day, values })

// Clear a single day's input values.
export const clearDay = (month, day) => call('clearDay', { month, day })

export { ApiError }
