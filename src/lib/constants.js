// Month tabs, exactly mirroring the Google Sheet tab names.
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export const MONTH_FULL = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
  May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
  Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December'
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// The data-entry columns the user actually fills in (everything else is derived).
// Keys map 1:1 to the day-record object used across the app.
export const INPUT_FIELDS = [
  { key: 'cash',        label: 'Cash',        group: 'shop' },
  { key: 'online',      label: 'Online / UPI', group: 'shop' },
  { key: 'card',        label: 'Card Machine', group: 'shop' },
  { key: 'salonCash',   label: 'Salon Cash',  group: 'salon' },
  { key: 'salonOnline', label: 'Salon Online', group: 'salon' },
  { key: 'expenses',    label: 'Expenses',    group: 'out' },
  { key: 'toSuppliers', label: 'To Suppliers', group: 'out' }
]

// Spreadsheet geometry: month sheets put the header on row 7, data on 8..38.
export const HEADER_ROW = 7
export const FIRST_DATA_ROW = 8

export const SYNC = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  OFFLINE: 'offline',
  ERROR: 'error'
}
