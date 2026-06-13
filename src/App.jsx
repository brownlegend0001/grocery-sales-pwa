import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Entry from './pages/Entry.jsx'
import MonthLog from './pages/MonthLog.jsx'
import DataIO from './pages/DataIO.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="entry" element={<Entry />} />
        <Route path="log" element={<MonthLog />} />
        <Route path="data" element={<DataIO />} />
      </Route>
    </Routes>
  )
}
