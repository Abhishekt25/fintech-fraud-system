import { useState } from 'react'
import { useStore } from '../../store'
import { api } from '../../utils/api'
import { formatCurrency, formatTime, timeAgo } from '../../utils/helpers'
import { StatusBadge, EmptyState } from '../shared/Layout'
import { RiskBadge } from '../shared/RiskBar'
import {
  ArrowRightLeft, ChevronDown, ChevronUp, Shield, CheckCircle, AlertTriangle
} from 'lucide-react'

const FILTERS = ['ALL', 'FLAGGED', 'BLOCKED', 'APPROVED']

export function TransactionFeed({ maxRows, compact = false }) {
  const { transactions, transactionFilter, setTransactionFilter, showToast, updateTransaction } = useStore()
  const [expanded, setExpanded] = useState(null)
  const [overriding, setOverriding] = useState(null)

  const filtered = transactions.filter(tx => {
    if (transactionFilter === 'ALL') return true
    return tx.status === transactionFilter
  })

  const displayed = maxRows ? filtered.slice(0, maxRows) : filtered

  const counts = {
    FLAGGED: transactions.filter(t => t.status === 'FLAGGED').length,
    BLOCKED: transactions.filter(t => t.status === 'BLOCKED').length,
  }

  async function handleOverride(txId, action) {
    setOverriding(txId)
    try {
      const result = await api.overrideTransaction(txId, action, `Analyst ${action.toLowerCase()} override`)
      updateTransaction(result.transaction)
      showToast(`Transaction marked as ${action === 'SAFE' ? 'safe' : 'blocked'}`, 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setOverriding(null)
    }
  }

  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="card-header">
        <div className="flex items-center gap-2.5">
          <ArrowRightLeft className="w-4 h-4 text-accent-cyan" />
          <span className="font-display font-semibold text-sm text-white">Live Transaction Feed</span>
        </div>
        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setTransactionFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                transactionFilter === f
                  ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-surface-700'
              }`}
            >
              {f === 'FLAGGED' ? (
                <span className="flex items-center gap-1.5">
                  FLAGGED {counts.FLAGGED > 0 && (
                    <span className="bg-amber-500 text-black text-xs rounded-full px-1.5 py-0 font-mono">{counts.FLAGGED}</span>
                  )}
                </span>
              ) : f === 'BLOCKED' ? (
                <span className="flex items-center gap-1.5">
                  BLOCKED {counts.BLOCKED > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0 font-mono">{counts.BLOCKED}</span>
                  )}
                </span>
              ) : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      {!compact && (
        <div className="grid grid-cols-[100px_1fr_120px_180px_120px_80px] gap-2 px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-surface-600 bg-surface-900/30">
          <div>Status</div>
          <div>Merchant</div>
          <div>Amount</div>
          <div>Location / Time</div>
          <div>Risk</div>
          <div className="text-right">Actions</div>
        </div>
      )}

      <div className="overflow-y-auto flex-1" style={{ maxHeight: maxRows ? `${maxRows * 64}px` : '500px' }}>
        {displayed.length === 0 ? (
          <EmptyState
            icon={ArrowRightLeft}
            title="Waiting for transactions..."
            subtitle="New transactions will appear here in real time"
          />
        ) : (
          displayed.map((tx) => (
            <TxRow
              key={tx.id}
              tx={tx}
              compact={compact}
              expanded={expanded === tx.id}
              onExpand={() => setExpanded(expanded === tx.id ? null : tx.id)}
              onOverride={handleOverride}
              overriding={overriding === tx.id}
            />
          ))
        )}
      </div>
    </div>
  )
}

function TxRow({ tx, compact, expanded, onExpand, onOverride, overriding }) {
  const rowClass = tx.status === 'FLAGGED'
    ? 'tx-row-flagged'
    : tx.status === 'BLOCKED'
    ? 'tx-row-blocked'
    : 'tx-row-approved'

  const flaggedRules = typeof tx.flagged_rules === 'string'
    ? JSON.parse(tx.flagged_rules || '[]')
    : (tx.flagged_rules || [])

  if (compact) {
    return (
      <div className={`flex items-center gap-3 px-4 py-2.5 border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors ${rowClass} animate-fade-in`}>
        <StatusBadge status={tx.status} override={tx.analyst_override} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">{tx.merchant}</div>
          <div className="text-xs text-slate-500">{tx.user_name} · {tx.country}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono font-semibold text-white">{formatCurrency(tx.amount)}</div>
          <div className="text-xs text-slate-600">{timeAgo(tx.created_at)}</div>
        </div>
        <RiskBadge score={tx.risk_score || 0} />
      </div>
    )
  }

  return (
    <>
      <div
        className={`grid grid-cols-[100px_1fr_120px_180px_120px_80px] gap-2 px-4 py-3.5 border-b border-surface-700/40
          hover:bg-surface-700/20 transition-colors cursor-pointer group ${rowClass} animate-fade-in`}
        onClick={onExpand}
      >
        <div className="flex items-center">
          <StatusBadge status={tx.status} override={tx.analyst_override} />
        </div>
        <div className="min-w-0 flex items-center">
          <div>
            <div className="text-sm font-medium text-white truncate">{tx.merchant}</div>
            <div className="text-xs text-slate-500 truncate">{tx.user_name} · {tx.category}</div>
          </div>
        </div>
        <div className="flex items-center">
          <span className="font-mono text-sm font-semibold text-white">{formatCurrency(tx.amount)}</span>
        </div>
        <div className="flex items-center">
          <div>
            <div className="text-xs text-slate-300">{tx.country}</div>
            <div className="text-xs text-slate-500 font-mono">{formatTime(tx.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center">
          <RiskBadge score={tx.risk_score || 0} />
        </div>
        <div className="flex items-center justify-end">
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-500" />
            : <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-b border-surface-600 bg-surface-900/50 px-6 py-4 animate-fade-in">
          <div className="grid grid-cols-3 gap-6">
            {/* Transaction details */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Transaction</div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">ID</span>
                  <span className="font-mono text-slate-300 truncate ml-2">{tx.id?.substring(0, 16)}…</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Device</span>
                  <span className="font-mono text-slate-300">{tx.device_id || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IP</span>
                  <span className="font-mono text-slate-300">{tx.ip_address || '—'}</span>
                </div>
                {tx.analyst_override && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Override</span>
                    <span className="text-accent-cyan font-medium">{tx.analyst_override}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Matched Rules */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Triggered Rules ({flaggedRules.length})
              </div>
              {flaggedRules.length === 0 ? (
                <div className="text-xs text-slate-600">No rules triggered</div>
              ) : (
                <div className="space-y-1.5">
                  {flaggedRules.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${r.action === 'BLOCK' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <span className="text-xs text-slate-300">{r.name}</span>
                      <span className="ml-auto text-xs font-mono text-slate-500">+{r.weight}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analyst Actions */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Analyst Actions</div>
              {tx.analyst_override ? (
                <div className="text-xs text-slate-400 italic">Already overridden: {tx.analyst_override}</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {tx.status !== 'APPROVED' && (
                    <button
                      onClick={() => onOverride(tx.id, 'SAFE')}
                      disabled={overriding}
                      className="btn-success text-xs py-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Mark Safe
                    </button>
                  )}
                  {tx.status !== 'BLOCKED' && (
                    <button
                      onClick={() => onOverride(tx.id, 'BLOCK')}
                      disabled={overriding}
                      className="btn-danger text-xs py-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Force Block
                    </button>
                  )}
                </div>
              )}
              {tx.analyst_note && (
                <div className="mt-2 text-xs text-slate-500 italic">"{tx.analyst_note}"</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
