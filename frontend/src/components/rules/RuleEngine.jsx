import { useState } from 'react'
import { useStore } from '../../store'
import { api } from '../../utils/api'
import { timeAgo, RULE_FIELDS, RULE_OPERATORS } from '../../utils/helpers'
import { EmptyState } from '../shared/Layout'
import {
  Shield, Plus, Trash2, ToggleLeft, ToggleRight, Edit2, X, Check,
  ChevronDown, ChevronUp, AlertTriangle, ShieldX
} from 'lucide-react'

export function RuleEngine() {
  const { rules, upsertRule, removeRule, showToast } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(null)

  const sorted = [...rules].sort((a, b) => b.priority - a.priority)

  async function handleToggle(rule) {
    setLoading(rule.id)
    try {
      const result = await api.toggleRule(rule.id)
      upsertRule(result.rule)
      showToast(`Rule ${result.rule.is_active ? 'enabled' : 'disabled'}`, 'info')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(null)
    }
  }

  async function handleDelete(ruleId) {
    if (!confirm('Delete this rule?')) return
    setLoading(ruleId)
    try {
      await api.deleteRule(ruleId)
      removeRule(ruleId)
      showToast('Rule deleted', 'info')
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
          <Shield className="w-4 h-4 text-accent-cyan" />
          <span className="font-display font-semibold text-sm text-white">Rule Engine</span>
          <span className="text-xs text-slate-500 font-mono">({rules.length} rules)</span>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null) }}
          className="btn-primary text-xs py-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New Rule
        </button>
      </div>

      {/* Create / Edit Form */}
      {(showForm || editingId) && (
        <RuleForm
          ruleId={editingId}
          existingRule={editingId ? rules.find(r => r.id === editingId) : null}
          onClose={() => { setShowForm(false); setEditingId(null) }}
          onSaved={(rule) => {
            upsertRule(rule)
            setShowForm(false)
            setEditingId(null)
            showToast('Rule saved successfully', 'success')
          }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* Rules list */}
      <div className="overflow-y-auto">
        {sorted.length === 0 ? (
          <EmptyState icon={Shield} title="No rules configured" subtitle="Create a rule to begin fraud detection" />
        ) : (
          sorted.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              loading={loading === rule.id}
              onToggle={() => handleToggle(rule)}
              onDelete={() => handleDelete(rule.id)}
              onEdit={() => { setEditingId(rule.id); setShowForm(false) }}
            />
          ))
        )}
      </div>
    </div>
  )
}

function RuleCard({ rule, loading, onToggle, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const conditions = typeof rule.conditions === 'string'
    ? JSON.parse(rule.conditions || '[]')
    : (rule.conditions || [])

  const actionConfig = rule.action === 'BLOCK'
    ? { label: 'BLOCK', cls: 'bg-red-950/60 text-red-400 border border-red-900/50' }
    : rule.action === 'FLAG'
    ? { label: 'FLAG', cls: 'bg-amber-950/60 text-amber-400 border border-amber-900/50' }
    : { label: 'ALLOW', cls: 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50' }

  return (
    <div className={`border-b border-surface-700/40 transition-all ${!rule.is_active ? 'opacity-50' : ''}`}>
      <div className="px-4 py-4 hover:bg-surface-700/20 transition-colors">
        <div className="flex items-start gap-3">
          {/* Priority badge */}
          <div className="shrink-0 w-10 text-center">
            <div className="text-xs font-mono font-bold text-accent-cyan">P{rule.priority}</div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-white">{rule.name}</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${actionConfig.cls}`}>
                {actionConfig.label}
              </span>
            </div>
            <div className="text-xs text-slate-500 mb-2">{rule.description}</div>

            {/* Conditions preview */}
            <div className="flex flex-wrap gap-1.5">
              {conditions.map((c, i) => (
                <span key={i} className="text-xs font-mono bg-surface-700/60 border border-surface-600/50 text-slate-400 px-2 py-1 rounded">
                  {c.field} {c.operator} {Array.isArray(c.value) ? `[${c.value.join(', ')}]` : c.value}
                </span>
              ))}
            </div>
          </div>

          {/* Meta + actions */}
          <div className="shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onEdit}
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-surface-600 rounded-lg transition-colors"
                title="Edit rule"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggle}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-accent-cyan hover:bg-surface-600 rounded-lg transition-colors"
                title={rule.is_active ? 'Disable rule' : 'Enable rule'}
              >
                {rule.is_active
                  ? <ToggleRight className="w-4 h-4 text-accent-cyan" />
                  : <ToggleLeft className="w-4 h-4" />}
              </button>
              <button
                onClick={onDelete}
                disabled={loading}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-surface-600 rounded-lg transition-colors"
                title="Delete rule"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>Weight: <span className="text-slate-400">{rule.weight}</span></span>
              <span>Logic: <span className="text-slate-400">{rule.logic}</span></span>
            </div>
            <div className="text-xs text-slate-600">{timeAgo(rule.updated_at)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

const EMPTY_CONDITION = { field: 'transaction.amount', operator: 'gt', value: '' }

function RuleForm({ ruleId, existingRule, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    name: existingRule?.name || '',
    description: existingRule?.description || '',
    priority: existingRule?.priority ?? 50,
    action: existingRule?.action || 'FLAG',
    weight: existingRule?.weight ?? 10,
    logic: existingRule?.logic || 'AND',
    conditions: existingRule?.conditions?.length
      ? (typeof existingRule.conditions === 'string' ? JSON.parse(existingRule.conditions) : existingRule.conditions)
      : [{ ...EMPTY_CONDITION }],
  })
  const [saving, setSaving] = useState(false)

  function updateCondition(i, key, val) {
    const conds = [...form.conditions]
    conds[i] = { ...conds[i], [key]: val }
    setForm(f => ({ ...f, conditions: conds }))
  }

  function addCondition() {
    setForm(f => ({ ...f, conditions: [...f.conditions, { ...EMPTY_CONDITION }] }))
  }

  function removeCondition(i) {
    setForm(f => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return onError('Rule name is required')
    if (!form.conditions.length) return onError('At least one condition is required')
    for (const c of form.conditions) {
      if (!c.value && c.value !== 0) return onError(`All conditions must have a value`)
    }

    setSaving(true)
    try {
      // Parse IN operator values to arrays
      const conditions = form.conditions.map(c => ({
        ...c,
        value: ['in', 'not_in'].includes(c.operator)
          ? c.value.toString().split(',').map(v => v.trim()).filter(Boolean)
          : isNaN(Number(c.value)) ? c.value : Number(c.value)
      }))

      const payload = { ...form, conditions }
      let result
      if (ruleId) {
        result = await api.updateRule(ruleId, payload)
      } else {
        result = await api.createRule(payload)
      }
      onSaved(result.rule)
    } catch (e) {
      onError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-b border-surface-600 bg-surface-900/60 px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-white">{ruleId ? 'Edit Rule' : 'Create New Rule'}</div>
        <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-white hover:bg-surface-600 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Rule Name *</label>
            <input
              className="input-field"
              placeholder="e.g. High Amount Alert"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Description</label>
            <input
              className="input-field"
              placeholder="Brief description of what this rule detects"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Action *</label>
            <select
              className="select-field"
              value={form.action}
              onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
            >
              <option value="FLAG">FLAG</option>
              <option value="BLOCK">BLOCK</option>
              <option value="ALLOW">ALLOW</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Priority (0–100)</label>
            <input
              type="number" min="0" max="100"
              className="input-field"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 50 }))}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Weight (risk pts)</label>
            <input
              type="number" min="1" max="100"
              className="input-field"
              value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: parseInt(e.target.value) || 10 }))}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Condition Logic</label>
            <select
              className="select-field"
              value={form.logic}
              onChange={e => setForm(f => ({ ...f, logic: e.target.value }))}
            >
              <option value="AND">AND (all must match)</option>
              <option value="OR">OR (any must match)</option>
            </select>
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-slate-500">Conditions</label>
            <button type="button" onClick={addCondition} className="text-xs text-accent-cyan hover:text-cyan-300 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Condition
            </button>
          </div>
          <div className="space-y-2">
            {form.conditions.map((cond, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-center">
                <select
                  className="select-field text-xs"
                  value={cond.field}
                  onChange={e => updateCondition(i, 'field', e.target.value)}
                >
                  {RULE_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <select
                  className="select-field text-xs"
                  value={cond.operator}
                  onChange={e => updateCondition(i, 'operator', e.target.value)}
                >
                  {RULE_OPERATORS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  className="input-field text-xs"
                  placeholder={['in', 'not_in'].includes(cond.operator) ? 'US,GB,DE (comma-separated)' : 'Value'}
                  value={Array.isArray(cond.value) ? cond.value.join(', ') : cond.value}
                  onChange={e => updateCondition(i, 'value', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeCondition(i)}
                  disabled={form.conditions.length === 1}
                  className="p-1.5 text-slate-600 hover:text-red-400 disabled:opacity-30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-1">
          <button type="submit" disabled={saving} className="btn-primary">
            <Check className="w-4 h-4" />
            {saving ? 'Saving…' : ruleId ? 'Update Rule' : 'Create Rule'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <div className="text-xs text-slate-600 ml-auto">
            Rules apply instantly to new transactions
          </div>
        </div>
      </form>
    </div>
  )
}
