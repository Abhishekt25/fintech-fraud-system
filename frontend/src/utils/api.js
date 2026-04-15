const BASE = `${import.meta.env.VITE_API_URL || ''}/api`

async function request(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  createTransaction: (tx) => request('POST', '/transactions', tx),
  getTransactions: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/transactions${q ? '?' + q : ''}`)
  },
  overrideTransaction: (id, action, note) =>
    request('PATCH', `/transactions/${id}/override`, { action, note }),

  getUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/users${q ? '?' + q : ''}`)
  },
  getUser: (id) => request('GET', `/users/${id}`),
  createUser: (data) => request('POST', '/users', data),
  freezeUser: (id, frozen) => request('PATCH', `/users/${id}/freeze`, { frozen }),
  resetRisk: (id) => request('PATCH', `/users/${id}/reset-risk`, {}),

  getRules: () => request('GET', '/rules'),
  createRule: (rule) => request('POST', '/rules', rule),
  updateRule: (id, rule) => request('PUT', `/rules/${id}`, rule),
  deleteRule: (id) => request('DELETE', `/rules/${id}`),
  toggleRule: (id) => request('PATCH', `/rules/${id}/toggle`, {}),

  getStats: () => request('GET', '/stats'),
}