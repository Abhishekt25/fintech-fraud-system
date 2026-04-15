import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useStore } from './store'
import { api } from './utils/api'
import { Sidebar, Toast } from './components/shared/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import UsersPage from './pages/Users'
import RulesPage from './pages/Rules'
import CreateTransaction from './pages/CreateTransaction'
import { Menu, X } from 'lucide-react'

export default function App() {
  const { connectWS, setUsers, setRules, updateStats, addTransaction } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    connectWS()
    async function loadInitialData() {
      try {
        const [usersRes, rulesRes, statsRes, txRes] = await Promise.allSettled([
          api.getUsers(),
          api.getRules(),
          api.getStats(),
          api.getTransactions({ limit: 100 }),
        ])
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.users || [])
        if (rulesRes.status === 'fulfilled') setRules(rulesRes.value.rules || [])
        if (statsRes.status === 'fulfilled') {
          const s = statsRes.value
          updateStats({
            total:    s.all_time?.total        || 0,
            flagged:  s.all_time?.flagged      || 0,
            blocked:  s.all_time?.blocked      || 0,
            volume:   s.all_time?.total_volume || 0,
            flagRate: s.all_time?.flag_rate    || 0,
            highRisk: s.users?.high_risk       || 0,
            frozen:   s.users?.frozen          || 0,
            live:     s.session?.live          || 0,
          })
        }
        if (txRes.status === 'fulfilled') {
          const txs = txRes.value.transactions || []
          ;[...txs].reverse().forEach(tx => addTransaction(tx))
        }
      } catch (e) {
        console.error('Failed to load initial data:', e)
      }
    }
    loadInitialData()
    const refreshInterval = setInterval(async () => {
      try {
        const res = await api.getUsers()
        setUsers(res.users || [])
      } catch {}
    }, 10000)
    return () => clearInterval(refreshInterval)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:static lg:z-auto
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onNavClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-surface-800 border-b border-surface-600 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-surface-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
              <span className="text-accent-cyan text-xs font-bold">F</span>
            </div>
            <span className="font-display text-sm font-bold text-white">FintechFraud</span>
          </div>
        </div>

        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/users"        element={<UsersPage />} />
          <Route path="/rules"        element={<RulesPage />} />
          <Route path="/create-trans" element={<CreateTransaction />} />
        </Routes>
      </main>

      <Toast />
    </div>
  )
}