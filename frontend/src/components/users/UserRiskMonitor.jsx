import { useState } from 'react'
import { useStore } from '../../store'
import { api } from '../../utils/api'
import { formatCurrency, formatNumber } from '../../utils/helpers'
import { RiskBar, RiskScore } from '../shared/RiskBar'
import { EmptyState } from '../shared/Layout'
import { Users, Snowflake, RefreshCw, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'

export function UserRiskMonitor({ maxRows, compact = false }) {
  const { users, userSortBy, setUserSortBy, showToast, upsertUser } = useStore()
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(null)

  const sorted = [...users].sort((a, b) => {
    if (userSortBy === 'risk_score') return b.risk_score - a.risk_score
    if (userSortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    if (userSortBy === 'volume') return b.total_volume - a.total_volume
    return 0
  })

  const displayed = maxRows ? sorted.slice(0, maxRows) : sorted

  async function handleFreeze(userId, frozen) {
    setLoading(userId)
    try {
      const result = await api.freezeUser(userId, frozen)
      upsertUser(result.user)
      showToast(`Account ${frozen ? 'frozen' : 'unfrozen'} successfully`, frozen ? 'warning' : 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(null)
    }
  }

  async function handleResetRisk(userId) {
    setLoading(userId)
    try {
      const result = await api.resetRisk(userId)
      upsertUser(result.user)
      showToast('Risk score reset to 0', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="card-header">
        <div className="flex items-center gap-2.5">
          <Users className="w-4 h-4 text-accent-cyan" />
          <span className="font-display font-semibold text-sm text-white">User Risk Monitor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort by</span>
          <select
            value={userSortBy}
            onChange={e => setUserSortBy(e.target.value)}
            className="bg-surface-700 border border-surface-500 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none"
          >
            <option value="risk_score">Risk Score</option>
            <option value="name">Name</option>
            <option value="volume">Volume</option>
          </select>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: maxRows ? `${maxRows * 72}px` : '500px' }}>
        {displayed.length === 0 ? (
          <EmptyState icon={Users} title="No users yet" subtitle="Users will appear after their first transaction" />
        ) : (
          displayed.map(user => (
            <UserRow
              key={user.id}
              user={user}
              compact={compact}
              expanded={!compact && expanded === user.id}
              onExpand={() => setExpanded(expanded === user.id ? null : user.id)}
              onFreeze={handleFreeze}
              onResetRisk={handleResetRisk}
              loading={loading === user.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

function UserRow({ user, compact, expanded, onExpand, onFreeze, onResetRisk, loading }) {
  const risk = parseFloat(user.risk_score || 0)
  const isFrozen = user.is_frozen

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-4 py-3 border-b border-surface-700/50 hover:bg-surface-700/20 transition-colors ${isFrozen ? 'opacity-60' : ''}`}>
        <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center text-xs font-bold text-slate-300">
          {user.name?.charAt(0)?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white truncate">{user.name}</span>
            {isFrozen && <Snowflake className="w-3 h-3 text-blue-400 shrink-0" />}
          </div>
          <RiskBar score={risk} size="sm" />
        </div>
        <RiskScore score={risk} size="sm" />
      </div>
    )
  }

  return (
    <>
      <div
        className={`flex items-center gap-4 px-4 py-3.5 border-b border-surface-700/40
          hover:bg-surface-700/20 transition-colors cursor-pointer group ${isFrozen ? 'opacity-75' : ''}`}
        onClick={onExpand}
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0
          ${isFrozen ? 'bg-blue-950/60 text-blue-400 border border-blue-900/50' : 'bg-surface-600 text-slate-200'}`}>
          {user.name?.charAt(0)?.toUpperCase()}
        </div>

        {/* Name + email */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{user.name}</span>
            {isFrozen && (
              <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-950/40 border border-blue-900/40 px-1.5 py-0.5 rounded">
                <Snowflake className="w-3 h-3" /> FROZEN
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 truncate">{user.email}</div>
        </div>

        {/* Risk bar */}
        <div className="w-32">
          <RiskBar score={risk} showLabel size="md" />
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
          <div className="text-right">
            <div className="font-mono text-white text-xs">{formatNumber(user.total_transactions)}</div>
            <div>txns</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-white text-xs">{formatCurrency(user.total_volume)}</div>
            <div>volume</div>
          </div>
        </div>

        {/* Expand */}
        <div className="w-4">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-500" />
            : <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-b border-surface-600 bg-surface-900/50 px-4 lg:px-6 py-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {/* Stats */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Activity</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Txns', value: formatNumber(user.total_transactions) },
                  { label: 'Volume', value: formatCurrency(user.total_volume) },
                  { label: 'Flagged', value: user.flagged_count || 0, cls: 'text-amber-400' },
                  { label: 'Blocked', value: user.blocked_count || 0, cls: 'text-red-400' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="bg-surface-700/50 rounded-lg p-2.5">
                    <div className={`text-sm font-mono font-bold ${cls || 'text-white'}`}>{value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk breakdown */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Risk Profile</div>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl font-mono font-bold">
                  <RiskScore score={risk} size="lg" />
                </div>
                <div className="text-xs text-slate-500">/ 100<br />risk score</div>
              </div>
              <RiskBar score={risk} size="lg" />
            </div>

            {/* Actions */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Analyst Controls</div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onFreeze(user.id, !isFrozen)}
                  disabled={loading}
                  className={isFrozen ? 'btn-success' : 'btn-danger'}
                >
                  {isFrozen ? (
                    <><Snowflake className="w-4 h-4" />Unfreeze Account</>
                  ) : (
                    <><Snowflake className="w-4 h-4" />Freeze Account</>
                  )}
                </button>
                <button
                  onClick={() => onResetRisk(user.id)}
                  disabled={loading}
                  className="btn-secondary"
                >
                  <RefreshCw className="w-4 h-4" />Reset Risk Score
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
