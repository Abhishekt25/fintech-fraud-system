import { getRiskLevel, getRiskBarColor } from '../../utils/helpers'

export function RiskBar({ score, showLabel = false, size = 'md' }) {
  const level = getRiskLevel(score)
  const barColor = getRiskBarColor(score)
  const width = `${Math.min(100, Math.max(0, score))}%`

  const heights = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' }

  return (
    <div className="flex items-center gap-2 w-full">
      <div className={`risk-bar flex-1 ${heights[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-mono font-semibold ${level.color} w-12 text-right`}>
          {Math.round(score)}
        </span>
      )}
    </div>
  )
}

export function RiskScore({ score, size = 'md' }) {
  const level = getRiskLevel(score)
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-4xl'
  }
  return (
    <span className={`font-mono font-bold ${level.color} ${sizes[size]}`}>
      {Math.round(score)}
    </span>
  )
}

export function RiskBadge({ score }) {
  const level = getRiskLevel(score)
  const bgColors = {
    CRITICAL: 'bg-red-950/60 border-red-900/50 text-red-400',
    HIGH:     'bg-orange-950/60 border-orange-900/50 text-orange-400',
    MEDIUM:   'bg-amber-950/60 border-amber-900/50 text-amber-400',
    LOW:      'bg-yellow-950/60 border-yellow-900/50 text-yellow-400',
    CLEAN:    'bg-emerald-950/60 border-emerald-900/50 text-emerald-400',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border font-mono ${bgColors[level.label]}`}>
      {Math.round(score)} · {level.label}
    </span>
  )
}
