import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { api } from '../utils/api'
import { formatCurrency, CATEGORIES, COUNTRIES } from '../utils/helpers'
import { PageHeader, LiveBadge, StatusBadge } from '../components/shared/Layout'
import { RiskBadge } from '../components/shared/RiskBar'
import { PlusCircle, User, RefreshCw, Zap, CheckCircle, AlertTriangle, ShieldX } from 'lucide-react'

const PRESET_MERCHANTS = [
  'Amazon', 'Starbucks', 'Tesla Motors', 'Netflix', 'Apple Store',
  'McDonald\'s', 'Steam', 'Coinbase', 'Binance', 'FanDuel',
  'Shell Gas', 'Marriott Hotel', 'Emirates Airlines', 'CVS Pharmacy', 'Best Buy',
]

export default function CreateTransaction() {
  const { users, showToast, stats } = useStore()
  const [form, setForm] = useState({
    user_id: '',
    amount: '',
    merchant: '',
    category: 'general',
    country: 'US',
    device_id: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '' })
  const [creatingUser, setCreatingUser] = useState(false)
  const [showNewUser, setShowNewUser] = useState(false)

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function randomize() {
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)].code
    const merchant = PRESET_MERCHANTS[Math.floor(Math.random() * PRESET_MERCHANTS.length)]
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    const amount = (Math.random() * 9900 + 100).toFixed(2)
    const userId = users[Math.floor(Math.random() * users.length)]?.id || form.user_id
    setForm(f => ({
      ...f,
      merchant,
      category,
      country,
      amount,
      user_id: userId,
      device_id: `dev-${Math.random().toString(36).substr(2, 8)}`,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.user_id) return showToast('Please select a user', 'warning')
    if (!form.merchant.trim()) return showToast('Merchant is required', 'warning')
    if (!form.amount || parseFloat(form.amount) <= 0) return showToast('Enter a valid amount', 'warning')

    setSubmitting(true)
    setLastResult(null)
    try {
      const result = await api.createTransaction({
        ...form,
        amount: parseFloat(form.amount),
        device_id: form.device_id || `dev-${Math.random().toString(36).substr(2, 8)}`,
      })
      setLastResult(result)
      showToast(`Transaction ${result.transaction?.status}`, result.transaction?.status === 'BLOCKED' ? 'error' : result.transaction?.status === 'FLAGGED' ? 'warning' : 'success')
    } catch (e) {
      showToast(e.message, 'error')
      if (e.message.includes('Duplicate')) {
        setLastResult({ duplicate: true })
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    if (!newUserForm.name || !newUserForm.email) return showToast('Name and email required', 'warning')
    setCreatingUser(true)
    try {
      const result = await api.createUser(newUserForm)
      showToast(`User ${result.user.name} created`, 'success')
      setShowNewUser(false)
      setNewUserForm({ name: '', email: '' })
      set('user_id', result.user.id)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setCreatingUser(false)
    }
  }

  const selectedUser = users.find(u => u.id === form.user_id)

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto max-w-5xl mx-auto">
      <PageHeader
        title="Create Transaction"
        subtitle="Inject a new transaction into the fraud detection pipeline"
        right={<LiveBadge />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Form */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2.5">
              <PlusCircle className="w-4 h-4 text-accent-cyan" />
              <span className="font-display font-semibold text-sm text-white">Transaction Details</span>
            </div>
            <button
              type="button"
              onClick={randomize}
              disabled={users.length === 0}
              className="btn-secondary text-xs py-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Randomize
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* User select */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400">User *</label>
                <button
                  type="button"
                  onClick={() => setShowNewUser(!showNewUser)}
                  className="text-xs text-accent-cyan hover:text-cyan-300 flex items-center gap-1"
                >
                  <User className="w-3 h-3" />
                  {showNewUser ? 'Cancel' : 'New User'}
                </button>
              </div>

              {showNewUser ? (
                <div className="bg-surface-700/50 border border-surface-500 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-accent-cyan mb-2">Create New User</div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="input-field"
                      placeholder="Full Name"
                      value={newUserForm.name}
                      onChange={e => setNewUserForm(f => ({ ...f, name: e.target.value }))}
                    />
                    <input
                      className="input-field"
                      placeholder="Email address"
                      type="email"
                      value={newUserForm.email}
                      onChange={e => setNewUserForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateUser}
                    disabled={creatingUser}
                    className="btn-primary text-xs py-1.5"
                  >
                    {creatingUser ? 'Creating…' : 'Create User'}
                  </button>
                </div>
              ) : (
                <select
                  className="select-field"
                  value={form.user_id}
                  onChange={e => set('user_id', e.target.value)}
                >
                  <option value="">— Select a user —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) {u.is_frozen ? '❄️ FROZEN' : `· Risk: ${Math.round(u.risk_score || 0)}`}
                    </option>
                  ))}
                </select>
              )}

              {/* Selected user preview */}
              {selectedUser && !showNewUser && (
                <div className="mt-2 flex items-center gap-3 bg-surface-700/40 rounded-lg px-3 py-2.5 border border-surface-600/50">
                  <div className="w-7 h-7 rounded-full bg-surface-600 flex items-center justify-center text-xs font-bold text-slate-300">
                    {selectedUser.name?.charAt(0)}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-medium text-white">{selectedUser.name}</div>
                    <div className="text-slate-500">{selectedUser.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Risk Score</div>
                    <RiskBadge score={selectedUser.risk_score || 0} />
                  </div>
                  {selectedUser.is_frozen && (
                    <div className="text-xs font-semibold text-blue-400 bg-blue-950/40 px-2 py-1 rounded border border-blue-900/40">
                      ❄️ FROZEN
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Amount + Merchant */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount (USD) *</label>
                <input
                  className="input-field font-mono"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Merchant *</label>
                <input
                  className="input-field"
                  placeholder="e.g. Amazon, Starbucks"
                  value={form.merchant}
                  onChange={e => set('merchant', e.target.value)}
                  list="merchant-list"
                />
                <datalist id="merchant-list">
                  {PRESET_MERCHANTS.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>

            {/* Category + Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                <select className="select-field" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Country</label>
                <select className="select-field" value={form.country} onChange={e => set('country', e.target.value)}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Device ID */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Device ID (optional)</label>
              <input
                className="input-field font-mono"
                placeholder="Auto-generated if blank"
                value={form.device_id}
                onChange={e => set('device_id', e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button type="submit" disabled={submitting} className="btn-primary w-full justify-center py-2.5">
                {submitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" />Processing…</>
                ) : (
                  <><Zap className="w-4 h-4" />Submit Transaction</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Result card */}
          {lastResult && (
            <ResultCard result={lastResult} />
          )}

          {/* Quick stats */}
          <div className="card p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Session Overview</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Processed', value: stats.total, color: 'text-white' },
                { label: 'Flagged', value: stats.flagged, color: 'text-amber-400' },
                { label: 'Blocked', value: stats.blocked, color: 'text-red-400' },
                { label: 'Flag Rate', value: `${stats.flagRate || 0}%`, color: 'text-orange-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-surface-700/40 rounded-lg p-3 border border-surface-600/50">
                  <div className={`text-xl font-display font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-slate-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk matrix hint */}
          <div className="card p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">High-Risk Triggers</div>
            <div className="space-y-2">
              {[
                { trigger: 'Amount > $5,000', tip: 'Triggers Large Transaction Alert' },
                { trigger: 'Country: NK, IR, SY...', tip: 'Triggers High Risk Country block' },
                { trigger: 'Category: crypto/gambling', tip: 'Triggers Suspicious Category' },
                { trigger: '10+ txns in 1 hour', tip: 'Triggers High Velocity rule' },
                { trigger: 'Volume > $20K/day', tip: 'Triggers Large Volume 24h' },
              ].map(({ trigger, tip }) => (
                <div key={trigger} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-300">{trigger}</div>
                    <div className="text-xs text-slate-600">{tip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultCard({ result }) {
  if (result.duplicate) {
    return (
      <div className="card p-5 border-amber-900/50 bg-amber-950/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">Duplicate Transaction</span>
        </div>
        <div className="text-xs text-slate-400">This transaction ID already exists. The duplicate was ignored to maintain state consistency.</div>
      </div>
    )
  }

  const tx = result.transaction
  if (!tx) return null

  const isBlocked = tx.status === 'BLOCKED'
  const isFlagged = tx.status === 'FLAGGED'
  const isApproved = tx.status === 'APPROVED'

  const borderColor = isBlocked ? 'border-red-900/50 bg-red-950/20'
    : isFlagged ? 'border-amber-900/50 bg-amber-950/20'
    : 'border-emerald-900/50 bg-emerald-950/10'

  const Icon = isBlocked ? ShieldX : isFlagged ? AlertTriangle : CheckCircle
  const iconColor = isBlocked ? 'text-red-400' : isFlagged ? 'text-amber-400' : 'text-emerald-400'
  const titleColor = isBlocked ? 'text-red-400' : isFlagged ? 'text-amber-400' : 'text-emerald-400'

  const flaggedRules = typeof tx.flagged_rules === 'string'
    ? JSON.parse(tx.flagged_rules || '[]')
    : (tx.flagged_rules || [])

  return (
    <div className={`card p-5 ${borderColor}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className={`text-sm font-semibold ${titleColor}`}>Transaction {tx.status}</span>
        <span className="ml-auto font-mono text-sm text-white">{formatCurrency(tx.amount)}</span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Risk Score</span>
          <RiskBadge score={tx.risk_score || 0} />
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Merchant</span>
          <span className="text-white">{tx.merchant}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Country</span>
          <span className="text-white">{tx.country}</span>
        </div>
      </div>

      {flaggedRules.length > 0 && (
        <div className="mt-3 pt-3 border-t border-surface-600/50">
          <div className="text-xs text-slate-500 mb-2">Triggered Rules:</div>
          {flaggedRules.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs mb-1">
              <span className={`w-1.5 h-1.5 rounded-full ${r.action === 'BLOCK' ? 'bg-red-500' : 'bg-amber-500'}`} />
              <span className="text-slate-300">{r.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
