import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'
import SignInGate from './components/SignInGate.jsx'
import './index.css'

// HashRouter is used so deep links work on GitHub Pages without server rewrites.
// SignInGate sits outside AppProvider so the app only loads sheet data once the
// authorised account is signed in.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <SignInGate>
        <AppProvider>
          <App />
        </AppProvider>
      </SignInGate>
    </HashRouter>
  </React.StrictMode>
)

// Auto-update the service worker in the background.
registerSW({ immediate: true })
