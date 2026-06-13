import { deriveDay } from './calc.js'

// CSV export uses the same column order as the Google Sheet.
const HEADER = [
  'Day', 'Date', 'Cash', 'Online/UPI', 'Card Machine', 'TOTAL SALES',
  'Salon Cash', 'Salon Online', 'Salon Total', 'Expenses', 'To Suppliers', 'NET PROFIT'
]

export function monthToCSV(rows) {
  const lines = [HEADER.join(',')]
  for (const raw of rows) {
    const r = deriveDay(raw)
    lines.push([
      r.weekday ?? '', r.date,
      r.cash, r.online, r.card, r.totalSales,
      r.salonCash, r.salonOnline, r.salonTotal,
      r.expenses, r.toSuppliers, r.netProfit
    ].join(','))
  }
  return lines.join('\n')
}

const clean = (v) => {
  const f = Number(String(v ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(f) ? f : 0
}

// Parse a month CSV back into input-only day objects. Tolerant of column order
// and header wording — matches by keyword so a sheet/Excel export still imports.
export function parseMonthCSV(text) {
  const lines = text.replace(/^﻿/, '').trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())

  const find = (pred) => header.findIndex(pred)
  const col = {
    date: find((h) => h === 'date' || h.includes('date')),
    cash: find((h) => h === 'cash' || (h.includes('cash') && !h.includes('salon'))),
    online: find((h) => (h.includes('online') || h.includes('upi')) && !h.includes('salon')),
    card: find((h) => h.includes('card')),
    salonCash: find((h) => h.includes('salon') && h.includes('cash')),
    salonOnline: find((h) => h.includes('salon') && (h.includes('online') || h.includes('upi'))),
    expenses: find((h) => h.includes('expense')),
    toSuppliers: find((h) => h.includes('supplier'))
  }

  const out = []
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',')
    const date = clean(col.date >= 0 ? cells[col.date] : i)
    if (!date || date < 1 || date > 31) continue
    out.push({
      date,
      cash: clean(cells[col.cash]),
      online: clean(cells[col.online]),
      card: clean(cells[col.card]),
      salonCash: clean(cells[col.salonCash]),
      salonOnline: clean(cells[col.salonOnline]),
      expenses: clean(cells[col.expenses]),
      toSuppliers: clean(cells[col.toSuppliers])
    })
  }
  return out
}
