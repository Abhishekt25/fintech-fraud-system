import { useStore } from '../../store'
import { formatCurrency, formatNumber } from '../../utils/helpers'
import {
  Zap, Activity, AlertTriangle, ShieldX, DollarSign, Users, Snowflake
} from 'lucide-react'

export function StatsGrid() {
  const { stats } = useStore()

  const flagRate = stats.total > 0
    ? Math.round(((stats.flagged + stats.blocked) / stats.total) * 100)
    : 0

  const cards = [
    {
      icon: Zap,
      value: formatNumber(stats.live),
      label: 'Live Transactions',
      sub: 'in current session',
      color: 'text-accent-cyan',
      iconBg: 'bg-cyan-950/60 border-cyan-900/50',
    },
    {
      icon: Activity,
      value: formatNumber(stats.total),
      label: 'Total Processed',
      sub: `${flagRate}% flag rate`,
      color: 'text-white',
      iconBg: 'bg-surface-600 border-surface-500',
    },
    {
      icon: AlertTriangle,
      value: formatNumber(stats.flagged),
      label: 'Flagged',
      sub: 'requires review',
      color: 'text-amber-400',
      iconBg: 'bg-amber-950/60 border-amber-900/50',
    },
    {
      icon: ShieldX,
      value: formatNumber(stats.blocked),
      label: 'Blocked',
      sub: 'auto-blocked by rules',
      color: 'text-red-400',
      iconBg: 'bg-red-950/60 border-red-900/50',
    },
    {
      icon: DollarSign,
      value: formatCurrency(stats.volume),
      label: 'Total Volume',
      sub: '',
      color: 'text-emerald-400',
      iconBg: 'bg-emerald-950/60 border-emerald-900/50',
    },
    {
      icon: Users,
      value: formatNumber(stats.highRisk || 0),
      label: 'High Risk Users',
      sub: `${formatNumber(stats.frozen || 0)} frozen accounts`,
      color: 'text-orange-400',
      iconBg: 'bg-orange-950/60 border-orange-900/50',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map(({ icon: Icon, value, label, sub, color, iconBg }) => (
        <div key={label} className="card px-4 py-4 hover:border-surface-500 transition-colors">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center mb-3 ${iconBg}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div className={`text-xl font-display font-bold num-transition ${color}`}>
            {value}
          </div>
          <div className="text-xs font-medium text-white mt-0.5">{label}</div>
          {sub && <div className="text-xs text-slate-600 mt-0.5">{sub}</div>}
        </div>
      ))}
    </div>
  )
}
