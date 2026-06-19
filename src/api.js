// ─── API Service Layer ────────────────────────────────────────────────────────
// Single place for all backend calls. Token stored in memory (cleared on logout)
const BASE = import.meta.env.https://egg-mart-backend.onrender.com || 'http://localhost:3001'



let _token = null

export function setToken(t) { _token = t }
export function getToken()  { return _token }
export function clearToken() { _token = null }

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  if (_token) headers['Authorization'] = `Bearer ${_token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (username, password) =>
  req('POST', '/api/auth/login', { username, password })

// ── Bills ────────────────────────────────────────────────────────────────────
export const createBill = (payload) => req('POST', '/api/bills', payload)
export const getBills   = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/bills${qs ? '?' + qs : ''}`)
}

// ── Sessions ─────────────────────────────────────────────────────────────────
export const openSession    = (opening_cash) => req('POST', '/api/sessions/open', { opening_cash })
export const closeSession   = (id, closing_cash, drawer_counts) =>
  req('POST', `/api/sessions/${id}/close`, { closing_cash, drawer_counts })
export const getCurrentSession = () => req('GET', '/api/sessions/current')
export const getAllSessions  = () => req('GET', '/api/sessions')        // admin
export const getMySessions   = () => req('GET', '/api/sessions/my')     // cashier

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts = () => req('GET', '/api/products')
