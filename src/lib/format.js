import { WEEKDAYS } from './constants.js'

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

// ₹ with Indian digit grouping (lakh/crore style).
export function rupee(v) {
  const num = Number(v) || 0
  return '₹' + inr.format(Math.round(num))
}

// Compact ₹ for tight KPI cards: ₹1.2L, ₹3.4Cr
export function rupeeCompact(v) {
  const num = Number(v) || 0
  const abs = Math.abs(num)
  if (abs >= 1e7) return '₹' + (num / 1e7).toFixed(2).replace(/\.00$/, '') + 'Cr'
  if (abs >= 1e5) return '₹' + (num / 1e5).toFixed(2).replace(/\.00$/, '') + 'L'
  if (abs >= 1e3) return '₹' + (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return '₹' + inr.format(Math.round(num))
}

export function pct(v, digits = 0) {
  return (Number(v) || 0).toFixed(digits) + '%'
}

// Weekday label for a given day-of-month in a given year/monthIndex (0-based).
export function weekdayFor(year, monthIndex, day) {
  if (!day) return ''
  const d = new Date(year, monthIndex, day)
  return WEEKDAYS[d.getDay()]
}

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export function todayParts() {
  const now = new Date()
  return { year: now.getFullYear(), monthIndex: now.getMonth(), day: now.getDate() }
}
