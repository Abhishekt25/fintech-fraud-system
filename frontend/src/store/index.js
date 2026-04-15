import { create } from 'zustand'

const getWSUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const url = new URL(import.meta.env.VITE_API_URL)
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${url.host}/ws`
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.hostname}:3001/ws`
}

const WS_URL = getWSUrl()

let wsInstance = null
let reconnectTimer = null
let reconnectAttempts = 0

export const useStore = create((set, get) => ({
  wsConnected: false,
  wsReconnecting: false,
  transactions: [],
  transactionFilter: 'ALL',
  users: [],
  userSortBy: 'risk_score',
  rules: [],
  stats: {
    live: 0, total: 0, flagged: 0, blocked: 0,
    volume: 0, flagRate: 0, highRisk: 0, frozen: 0,
  },
  toast: null,

  setTransactionFilter: (f) => set({ transactionFilter: f }),
  setUserSortBy: (s) => set({ userSortBy: s }),

  addTransaction: (tx) => set((s) => {
    const existing = s.transactions.find(t => t.id === tx.id)
    if (existing) {
      return { transactions: s.transactions.map(t => t.id === tx.id ? { ...t, ...tx } : t) }
    }
    return { transactions: [tx, ...s.transactions].slice(0, 200) }
  }),

  updateTransaction: (tx) => set((s) => ({
    transactions: s.transactions.map(t => t.id === tx.id ? { ...t, ...tx } : t)
  })),

  setUsers: (users) => set({ users }),

  upsertUser: (user) => set((s) => {
    const exists = s.users.find(u => u.id === user.id)
    if (exists) return { users: s.users.map(u => u.id === user.id ? { ...u, ...user } : u) }
    return { users: [...s.users, user] }
  }),

  setRules: (rules) => set({ rules }),

  upsertRule: (rule) => set((s) => {
    const exists = s.rules.find(r => r.id === rule.id)
    if (exists) return { rules: s.rules.map(r => r.id === rule.id ? { ...r, ...rule } : r) }
    return { rules: [rule, ...s.rules] }
  }),

  removeRule: (id) => set((s) => ({ rules: s.rules.filter(r => r.id !== id) })),

  updateStats: (partial) => set((s) => ({ stats: { ...s.stats, ...partial } })),

  showToast: (msg, type = 'info') => {
    set({ toast: { msg, type, id: Date.now() } })
    setTimeout(() => set({ toast: null }), 3500)
  },

  connectWS: () => {
    if (wsInstance?.readyState === WebSocket.OPEN) return

    const connect = () => {
      wsInstance = new WebSocket(WS_URL)

      wsInstance.onopen = () => {
        reconnectAttempts = 0
        set({ wsConnected: true, wsReconnecting: false })
        console.log('WS connected')
      }

      wsInstance.onclose = () => {
        set({ wsConnected: false })
        const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000)
        reconnectAttempts++
        set({ wsReconnecting: true })
        reconnectTimer = setTimeout(connect, delay)
      }

      wsInstance.onerror = () => wsInstance?.close()

      wsInstance.onmessage = (e) => {
        try {
          const { type, data } = JSON.parse(e.data)
          const s = get()
          switch (type) {
            case 'TRANSACTION':        s.addTransaction(data); break
            case 'TRANSACTION_UPDATED': s.updateTransaction(data); break
            case 'USER_UPDATED':
            case 'USER_CREATED':       s.upsertUser(data); break
            case 'RULE_UPDATED':       s.upsertRule(data); break
            case 'RULE_DELETED':       s.removeRule(data.id); break
            case 'STATS_UPDATED':      s.updateStats(data); break
          }
        } catch {}
      }
    }

    connect()
  },

  disconnectWS: () => {
    clearTimeout(reconnectTimer)
    wsInstance?.close()
    wsInstance = null
    set({ wsConnected: false, wsReconnecting: false })
  },
}))