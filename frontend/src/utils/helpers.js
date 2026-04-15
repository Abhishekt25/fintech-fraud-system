export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

export function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(n || 0)
}

export function formatTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function getRiskLevel(score) {
  if (score >= 80) return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500' }
  if (score >= 60) return { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500' }
  if (score >= 40) return { label: 'MEDIUM', color: 'text-amber-400', bg: 'bg-amber-500' }
  if (score >= 20) return { label: 'LOW', color: 'text-yellow-400', bg: 'bg-yellow-500' }
  return { label: 'CLEAN', color: 'text-emerald-400', bg: 'bg-emerald-500' }
}

export function getRiskBarColor(score) {
  if (score >= 80) return 'bg-red-500'
  if (score >= 60) return 'bg-orange-500'
  if (score >= 40) return 'bg-amber-500'
  if (score >= 20) return 'bg-yellow-500'
  return 'bg-emerald-500'
}

export const CATEGORIES = [
  'general', 'food', 'travel', 'retail', 'electronics',
  'crypto', 'gambling', 'adult', 'weapons', 'healthcare',
  'education', 'entertainment', 'utilities', 'finance'
]

export const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'RU', name: 'Russia' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NK', name: 'North Korea 🚨' },
  { code: 'IR', name: 'Iran 🚨' },
  { code: 'SY', name: 'Syria 🚨' },
  { code: 'VE', name: 'Venezuela 🚨' },
]

export const RULE_FIELDS = [
  { value: 'transaction.amount', label: 'Transaction Amount' },
  { value: 'transaction.country', label: 'Transaction Country' },
  { value: 'transaction.category', label: 'Merchant Category' },
  { value: 'user.risk_score', label: 'User Risk Score' },
  { value: 'user.transactions_last_hour', label: 'Transactions (Last Hour)' },
  { value: 'user.countries_last_hour', label: 'Countries (Last Hour)' },
  { value: 'user.devices_last_hour', label: 'Devices (Last Hour)' },
  { value: 'user.volume_last_24h', label: 'Volume (Last 24h)' },
]

export const RULE_OPERATORS = [
  { value: 'gt', label: '> Greater Than' },
  { value: 'gte', label: '>= Greater or Equal' },
  { value: 'lt', label: '< Less Than' },
  { value: 'lte', label: '<= Less or Equal' },
  { value: 'eq', label: '= Equal' },
  { value: 'neq', label: '≠ Not Equal' },
  { value: 'in', label: 'IN (comma-separated list)' },
  { value: 'not_in', label: 'NOT IN (comma-separated list)' },
  { value: 'contains', label: 'Contains' },
]
