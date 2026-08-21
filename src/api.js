// ─── API Service Layer ────────────────────────────────────────────────────────
// Single place for all backend calls.
//
// Token is persisted to localStorage (previously memory-only: `let _token =
// null` was never written to storage, so any page refresh silently dropped
// the session — and, combined with cart/held-bills living only in component
// state, could wipe an in-progress sale too).

const BASE = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'egg-mart:token'

let _token = null
try {
  _token = localStorage.getItem(TOKEN_KEY)
} catch {
  // localStorage can throw in some environments (private mode, disabled
  // storage); fall back to memory-only rather than crashing on load.
}

export function setToken(t) {
  _token = t
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // ignore storage errors, session just won't survive a refresh
  }
}
export function getToken()  { return _token }
export function clearToken() { setToken(null) }

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

export const registerAdmin = (payload) =>
  req('POST', '/api/auth/register-admin', payload)

// Cashier signup goes through the shared /api/auth/register endpoint with
// role: 'cashier' — there is no separate /register-cashier route on the
// backend. payload should include { username, password, name?, shop_location }.
export const registerCashier = (payload) =>
  req('POST', '/api/auth/register', { ...payload, role: 'cashier' })

// ── Users ────────────────────────────────────────────────────────────────────
export const getUsers   = () => req('GET', '/api/users')
export const updateUser = (id, payload) => req('PATCH', `/api/users/${id}`, payload)

// ── Bills ────────────────────────────────────────────────────────────────────
export const createBill = (payload) => req('POST', '/api/bills', payload)
export const getBills   = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/bills${qs ? '?' + qs : ''}`)
}
export const voidBill = (id) => req('PATCH', `/api/bills/${id}/void`)
export const settleCreditBill = (id, payment_method) => req('PATCH', `/api/bills/${id}/settle-credit`, { payment_method })
export const getBill  = (id) => req('GET', `/api/bills/${id}`)

// ── Purchases ────────────────────────────────────────────────────────────────
export const createPurchase = (payload) => req('POST', '/api/purchases', payload)
export const getPurchases   = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/purchases${qs ? '?' + qs : ''}`)
}
export const getPurchase    = (id) => req('GET', `/api/purchases/${id}`)

// ── Sessions ─────────────────────────────────────────────────────────────────
export const openSession    = (opening_cash) => req('POST', '/api/sessions/open', { opening_cash })
export const closeSession   = (id, closing_cash, drawer_counts) =>
  req('POST', `/api/sessions/${id}/close`, { closing_cash, drawer_counts })
export const getCurrentSession = () => req('GET', '/api/sessions/current')
export const getAllSessions  = () => req('GET', '/api/sessions')        // admin
export const getMySessions   = () => req('GET', '/api/sessions/my')     // cashier

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/products${qs ? '?' + qs : ''}`)
}
export const getProduct     = (id) => req('GET', `/api/products/${id}`)
export const createProduct  = (payload) => req('POST', '/api/products', payload)
export const updateProduct  = (id, payload) => req('PUT', `/api/products/${id}`, payload)
export const deleteProduct  = (id) => req('DELETE', `/api/products/${id}`)
export const getCategories  = () => req('GET', '/api/products/categories/list')

// ── Inventory ────────────────────────────────────────────────────────────────
export const getInventory  = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/inventory${qs ? '?' + qs : ''}`)
}
export const getLowStock   = (threshold) =>
  req('GET', `/api/inventory/low-stock${threshold ? `?threshold=${threshold}` : ''}`)
export const adjustInventory = (payload) => req('POST', '/api/inventory/adjust', payload)
export const getProductHistory = (productId) => req('GET', `/api/inventory/${productId}/history`)

// ── Customers ────────────────────────────────────────────────────────────────
export const getCustomers   = () => req('GET', '/api/customers')
export const getCustomer    = (id) => req('GET', `/api/customers/${id}`)
export const createCustomer = (payload) => req('POST', '/api/customers', payload)
export const updateCustomer = (id, payload) => req('PUT', `/api/customers/${id}`, payload)
export const deleteCustomer = (id) => req('DELETE', `/api/customers/${id}`)

// ── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardSummary = () => req('GET', '/api/dashboard/summary')

// ── Shops (admin) ────────────────────────────────────────────────────────────
export const getShops   = () => req('GET', '/api/shops')
export const getShop    = (id) => req('GET', `/api/shops/${id}`)
export const createShop = (payload) => req('POST', '/api/shops', payload)
export const updateShop = (id, payload) => req('PUT', `/api/shops/${id}`, payload)
export const deleteShop = (id) => req('DELETE', `/api/shops/${id}`)

// ── Expenses (admin) ─────────────────────────────────────────────────────────
export const getExpenses    = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/expenses${qs ? '?' + qs : ''}`)
}
export const createExpense  = (payload) => req('POST', '/api/expenses', payload)
export const updateExpense  = (id, payload) => req('PUT', `/api/expenses/${id}`, payload)
export const deleteExpense  = (id) => req('DELETE', `/api/expenses/${id}`)

// ── Suppliers (admin) ────────────────────────────────────────────────────────
export const getSuppliers   = () => req('GET', '/api/suppliers')
export const getSupplier    = (id) => req('GET', `/api/suppliers/${id}`)
export const createSupplier = (payload) => req('POST', '/api/suppliers', payload)
export const updateSupplier = (id, payload) => req('PUT', `/api/suppliers/${id}`, payload)
export const deleteSupplier = (id) => req('DELETE', `/api/suppliers/${id}`)

// ── Reports (admin) ──────────────────────────────────────────────────────────
export const getReportSummary  = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/reports/summary${qs ? '?' + qs : ''}`)
}
export const getReportRange    = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/reports/range${qs ? '?' + qs : ''}`)
}
export const getReportProducts = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/reports/products${qs ? '?' + qs : ''}`)
}
export const getReportExpenses = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/reports/expenses${qs ? '?' + qs : ''}`)
}
export const getReportPaymentMethods = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return req('GET', `/api/reports/payment-methods${qs ? '?' + qs : ''}`)
}
