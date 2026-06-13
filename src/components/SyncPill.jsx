import { useApp } from '../context/AppContext.jsx'
import { SYNC } from '../lib/constants.js'

const MAP = {
  [SYNC.SYNCED]:  { dot: 'bg-accent',  text: 'Synced',            cls: 'bg-accent/10 text-accent' },
  [SYNC.SYNCING]: { dot: 'bg-accent2 animate-pulse', text: 'Syncing…', cls: 'bg-accent2/10 text-accent2' },
  [SYNC.OFFLINE]: { dot: 'bg-warn',    text: 'Offline · saved',   cls: 'bg-warn/10 text-warn' },
  [SYNC.ERROR]:   { dot: 'bg-danger',  text: 'Retry pending',     cls: 'bg-danger/10 text-danger' }
}

export default function SyncPill() {
  const { sync } = useApp()
  const s = MAP[sync.status] || MAP[SYNC.SYNCED]
  const label = sync.pending > 0 && sync.status !== SYNC.SYNCED
    ? `${s.text} (${sync.pending})`
    : s.text

  return (
    <span className={`pill ${s.cls}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {label}
    </span>
  )
}
