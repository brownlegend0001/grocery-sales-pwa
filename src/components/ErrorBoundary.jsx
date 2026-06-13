import React from 'react'

// Catches render-time crashes anywhere below it and shows the actual error
// (instead of a blank screen), with a button that clears caches + SW and reloads.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info)
  }

  hardReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const rs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(rs.map((r) => r.unregister()))
      }
      if (window.caches) {
        const ks = await caches.keys()
        await Promise.all(ks.map((k) => caches.delete(k)))
      }
    } catch (e) { /* ignore */ }
    location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    const msg = this.state.error?.message || String(this.state.error)
    return (
      <div style={S.wrap}>
        <div style={S.icon}>⚠️</div>
        <div style={S.title}>Something broke while loading</div>
        <div style={S.msg}>{msg}</div>
        <button style={S.btn} onClick={this.hardReload}>Clear cache &amp; reload</button>
        <div style={S.ver}>build YR-4</div>
      </div>
    )
  }
}

const S = {
  wrap: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '24px', textAlign: 'center', fontFamily: '-apple-system,system-ui,sans-serif', color: '#e2e8f0', background: '#0b1120' },
  icon: { fontSize: '34px' },
  title: { fontSize: '16px', fontWeight: 700 },
  msg: { fontSize: '12px', color: '#fbbf24', fontFamily: 'ui-monospace,monospace', maxWidth: '20rem', wordBreak: 'break-word' },
  btn: { marginTop: '8px', padding: '12px 20px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg,#34d399,#10b981)', color: '#06281c', fontWeight: 700, fontSize: '14px' },
  ver: { marginTop: '6px', fontSize: '10px', color: '#475569' }
}
