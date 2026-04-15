import { NavLink } from 'react-router-dom'
import { useStore } from '../../store'
import {
  LayoutDashboard, ArrowRightLeft, Users, Shield,
  Wifi, WifiOff, PlusCircle, Activity
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/rules', label: 'Rule Engine', icon: Shield },
  { to: '/create-trans', label: 'Create Transaction', icon: PlusCircle },
]

export function Sidebar({ onNavClick }) {
  const { wsConnected, wsReconnecting, stats } = useStore()

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-surface-800 border-r border-surface-600 h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-600">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-accent-cyan" />
          </div>
          <div>
            <div className="font-display text-sm font-bold text-white tracking-wide">FintechFraud</div>
            <div className="text-xs text-slate-500 font-mono">v1.0 · LIVE</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onNavClick}  // ← only addition
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive
                  ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent-cyan' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {label}
                {to === '/transactions' && stats.total > 0 && (
                  <span className="ml-auto text-xs font-mono bg-surface-600 text-slate-400 px-1.5 py-0.5 rounded">
                    {stats.total > 999 ? '999+' : stats.total}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Connection status — unchanged */}
      <div className="px-4 py-4 border-t border-surface-600">
        <div className={`flex items-center gap-2 text-xs ${wsConnected ? 'text-emerald-400' : wsReconnecting ? 'text-amber-400' : 'text-red-400'}`}>
          {wsConnected ? (
            <><Wifi className="w-3.5 h-3.5" /><span>Live Connection</span></>
          ) : wsReconnecting ? (
            <><WifiOff className="w-3.5 h-3.5 animate-pulse" /><span>Reconnecting…</span></>
          ) : (
            <><WifiOff className="w-3.5 h-3.5" /><span>Disconnected</span></>
          )}
          {wsConnected && (
            <span className="ml-auto">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </span>
          )}
        </div>
      </div>
    </aside>
  )
}

export function LiveBadge() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/50 border border-emerald-900/50 rounded-full">
      <span className="relative flex w-2 h-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-xs font-semibold text-emerald-400 tracking-wider">LIVE</span>
    </div>
  )
}

export function PageHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  )
}

export function Toast() {
  const { toast } = useStore()
  if (!toast) return null

  const colors = {
    info: 'bg-surface-600 border-surface-500 text-white',
    success: 'bg-emerald-950 border-emerald-900 text-emerald-300',
    error: 'bg-red-950 border-red-900 text-red-300',
    warning: 'bg-amber-950 border-amber-900 text-amber-300',
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl animate-slide-in-right ${colors[toast.type] || colors.info}`}>
      {toast.msg}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-surface-700 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-slate-600" />
      </div>
      <div className="text-sm font-medium text-slate-500">{title}</div>
      {subtitle && <div className="text-xs text-slate-600 mt-1">{subtitle}</div>}
    </div>
  )
}

export function StatusBadge({ status, override }) {
  const label = override ? `${status} (OVR)` : status
  if (status === 'APPROVED') return <span className="badge-approved">{label}</span>
  if (status === 'FLAGGED') return <span className="badge-flagged">{label}</span>
  if (status === 'BLOCKED') return <span className="badge-blocked">{label}</span>
  return <span className="badge-pending">{label}</span>
}
