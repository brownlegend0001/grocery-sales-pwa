// Single source of truth for the business logic. These must stay identical to
// the formulas in the Google Sheet and in apps-script/Code.gs.
//
//   TOTAL SALES = Cash + Online/UPI + Card Machine
//   Salon Total = Salon Cash + Salon Online
//   NET PROFIT  = TOTAL SALES + Salon Total - Expenses - To Suppliers

const n = (v) => {
  const x = typeof v === 'string' ? v.replace(/[^0-9.-]/g, '') : v
  const f = Number(x)
  return Number.isFinite(f) ? f : 0
}

export function deriveDay(d = {}) {
  const cash = n(d.cash)
  const online = n(d.online)
  const card = n(d.card)
  const salonCash = n(d.salonCash)
  const salonOnline = n(d.salonOnline)
  const expenses = n(d.expenses)
  const toSuppliers = n(d.toSuppliers)

  const totalSales = cash + online + card
  const salonTotal = salonCash + salonOnline
  const netProfit = totalSales + salonTotal - expenses - toSuppliers

  return {
    ...d,
    cash, online, card, salonCash, salonOnline, expenses, toSuppliers,
    totalSales, salonTotal, netProfit
  }
}

// Roll a list of day records up into the month KPIs shown on the dashboard and
// the Summary tab.
export function summariseMonth(days = []) {
  const filled = days
    .map(deriveDay)
    .filter((d) => d.totalSales > 0 || d.expenses > 0 || d.toSuppliers > 0 || d.salonTotal > 0)

  const sum = (k) => filled.reduce((a, d) => a + (d[k] || 0), 0)

  const totalSales = sum('totalSales')
  const cash = sum('cash')
  const online = sum('online')
  const card = sum('card')
  const salon = sum('salonTotal')
  const expenses = sum('expenses')
  const toSuppliers = sum('toSuppliers')
  const netProfit = sum('netProfit')

  const activeDays = filled.length
  const dailyAvg = activeDays ? totalSales / activeDays : 0

  let best = null
  let worst = null
  for (const d of filled) {
    if (!best || d.totalSales > best.totalSales) best = d
    if (!worst || d.totalSales < worst.totalSales) worst = d
  }

  const denom = cash + online + card
  return {
    totalSales, cash, online, card, salon, expenses, toSuppliers, netProfit,
    dailyAvg, activeDays,
    bestDay: best ? { date: best.date, value: best.totalSales } : null,
    worstDay: worst ? { date: worst.date, value: worst.totalSales } : null,
    cashPct: denom ? (cash / denom) * 100 : 0,
    onlinePct: denom ? (online / denom) * 100 : 0,
    cardPct: denom ? (card / denom) * 100 : 0
  }
}
