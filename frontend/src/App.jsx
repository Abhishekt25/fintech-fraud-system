import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useStore } from './store'
import { api } from './utils/api'
import { Sidebar, Toast } from './components/shared/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import UsersPage from './pages/Users'
import RulesPage from './pages/Rules'
import CreateTransaction from './pages/CreateTransaction'

export default function App() {
  const { connectWS, setUsers, setRules, updateStats, addTransaction } = useStore()

  useEffect(() => {
    connectWS()

    async function loadInitialData() {
      try {
        const [usersRes, rulesRes, statsRes, txRes] = await Promise.allSettled([
          api.getUsers(),
          api.getRules(),
          api.getStats(),
          api.getTransactions({ limit: 100 }),  // ← load existing transactions
        ])

        if (usersRes.status === 'fulfilled') {
          setUsers(usersRes.value.users || [])
        }
        if (rulesRes.status === 'fulfilled') {
          setRules(rulesRes.value.rules || [])
        }
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
          // Add in reverse so newest ends up on top
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
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/transactions"  element={<Transactions />} />
          <Route path="/users"         element={<UsersPage />} />
          <Route path="/rules"         element={<RulesPage />} />
          <Route path="/create-trans"  element={<CreateTransaction />} />
        </Routes>
      </main>
      <Toast />
    </div>
  )
}