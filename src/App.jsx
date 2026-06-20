import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import LoginPage from './pages/LoginPage'
import Sidebar   from './components/Sidebar'
import BillingPage      from './pages/BillingPage'
import DashboardPage    from './pages/DashboardPage'
import ProductsPage     from './pages/ProductsPage'
import PurchasesPage    from './pages/PurchasesPage'
import SessionStartPage from './pages/SessionStartPage'
import SessionPage      from './pages/SessionPage'
import {
  ReportsPage,
  InventoryPage,
  HistoryPage,
  SettingsPage,
  SessionEndPage,
} from './pages/OtherPages'
import { PRODUCTS as DEFAULT_PRODUCTS } from './data'

export const AppContext = createContext(null)
export function useApp() { return useContext(AppContext) }

const API = import.meta.env.VITE_API_URL

// ─── Shared Store (single source of truth) ──────────────────────────────────
let _sharedProducts     = DEFAULT_PRODUCTS
let _sharedTransactions = []
let _sharedPurchases    = []
let _sharedSessions     = []
let _sharedActiveSession = null
let _invoiceNum         = 1
let _listeners          = []

function subscribe(fn) { _listeners.push(fn); return () => { _listeners = _listeners.filter(l => l !== fn) } }
function notify()      { _listeners.forEach(fn => fn()) }

function getSharedState() {
  return {
    products:      _sharedProducts,
    transactions:  _sharedTransactions,
    purchases:     _sharedPurchases,
    sessions:      _sharedSessions,
    activeSession: _sharedActiveSession,
    invoiceNum:    _invoiceNum,
  }
}

// ─── Shared Settings ─────────────────────────────────────────────────────────
let _sharedTheme       = 'dark'
let _sharedProductView = 'grid'
let _sharedTax         = 0
let _sharedCustomerName = 'Walk-in Customer'
let _settingsListeners = []
function subscribeSettings(fn) { _settingsListeners.push(fn); return () => { _settingsListeners = _settingsListeners.filter(l => l !== fn) } }
function notifySettings()      { _settingsListeners.forEach(fn => fn()) }

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [role,   setRole]   = useState(null)
  const [token,  setToken]  = useState(null)   // ← JWT token from backend
  const [active, setActive] = useState('billing')

  // Settings
  const [theme,        setThemeState]        = useState(_sharedTheme)
  const [productView,  setProductViewState]  = useState(_sharedProductView)
  const [tax,          setTaxState]          = useState(_sharedTax)
  const [customerName, setCustomerNameState] = useState(_sharedCustomerName)

  // Shared data
  const [, forceUpdate] = useState(0)
  const refresh = useCallback(() => forceUpdate(n => n + 1), [])

  useEffect(() => {
    const unsub  = subscribe(refresh)
    const unsubS = subscribeSettings(refresh)
    return () => { unsub(); unsubS() }
  }, [refresh])

  // Toast
  const [toast, setToast] = useState(null)
  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Theme effect
  useEffect(() => {
    const root = document.documentElement
    if (_sharedTheme === 'light') root.setAttribute('data-theme', 'light')
    else root.removeAttribute('data-theme')
  }, [theme])

  // ─── Setters ─────────────────────────────────────────────────────────────
  function setTheme(v)        { _sharedTheme = v;        setThemeState(v);        notifySettings() }
  function setProductView(v)  { _sharedProductView = v;  setProductViewState(v);  notifySettings() }
  function setTax(v)          { _sharedTax = v;          setTaxState(v);          notifySettings() }
  function setCustomerName(v) { _sharedCustomerName = v; setCustomerNameState(v); notifySettings() }

  function setProducts(updater) {
    _sharedProducts = typeof updater === 'function' ? updater(_sharedProducts) : updater
    notify()
  }
  function setTransactions(updater) {
    _sharedTransactions = typeof updater === 'function' ? updater(_sharedTransactions) : updater
    notify()
  }
  function setPurchases(updater) {
    _sharedPurchases = typeof updater === 'function' ? updater(_sharedPurchases) : updater
    notify()
  }

  // ─── Auth ────────────────────────────────────────────────────────────────
  function handleLogin(r, tok) {
    setRole(r)
    setToken(tok || null)                           // store the JWT token
    setActive(r === 'admin' ? 'dashboard' : 'session-start')
  }

  // ─── Session management ──────────────────────────────────────────────────
  /**
   * startSession — called from SessionStartPage after user fills drawer count.
   *
   * Flow:
   *  1. If we have a JWT token, check the backend for a stale open session.
   *  2. If one exists, close it silently (auto-recovery).
   *  3. Open a fresh session on the backend.
   *  4. Fall back to local-only mode if no token (dev/demo).
   */
  async function startSession(openingCash, drawerCounts) {
    if (token) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }

        // ── Step 1: check for an existing open session ──────────────────
        const currentRes = await fetch(`${API}/api/sessions/current`, { headers })

        if (currentRes.ok) {
          const existing = await currentRes.json()

          // ── Step 2: silently close the stale session ──────────────────
          await fetch(`${API}/api/sessions/${existing.id}/close`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              closing_cash:  existing.opening_cash ?? 0,
              drawer_counts: null,
            }),
          })
          showToast('Previous session auto-closed', 'info')
        }

        // ── Step 3: open a fresh session on the backend ──────────────────
        const openRes = await fetch(`${API}/api/sessions/open`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            opening_cash:  openingCash,
            drawer_counts: drawerCounts ?? null,
          }),
        })

        if (!openRes.ok) {
          const err = await openRes.json()
          showToast(err.error || 'Failed to start session', 'error')
          return
        }

        const serverSession = await openRes.json()

        // ── Step 4: sync backend session into local state ─────────────────
        _sharedActiveSession = {
          id:           serverSession.id,
          date:         serverSession.opened_at,
          dateStr:      new Date(serverSession.opened_at).toDateString(),
          openingCash:  Number(serverSession.opening_cash),
          startTime:    new Date(serverSession.opened_at),
          transactions: [],
          status:       'active',
          _backendId:   serverSession.id,
        }
        notify()
        setActive('billing')
        showToast('Session started successfully')
        return
      } catch (err) {
        console.error('Session API error:', err)
        showToast('Server unreachable — starting offline session', 'warning')
        // fall through to local-only mode below
      }
    }

    // ── Local-only / offline mode ─────────────────────────────────────────
    _sharedActiveSession = {
      id:           Date.now(),
      date:         new Date().toISOString(),
      dateStr:      new Date().toDateString(),
      openingCash,
      startTime:    new Date(),
      transactions: [],
      status:       'active',
    }
    notify()
    setActive('billing')
    showToast('Session started (offline mode)')
  }

  function endSession() {
    setActive('session-end')
  }

  async function closeSession() {
    if (_sharedActiveSession) {
      // Close on backend if we have a token and a backend session id
      if (token && _sharedActiveSession._backendId) {
        try {
          const cashTotal = (_sharedActiveSession.transactions || [])
            .filter(t => t.method === 'Cash')
            .reduce((s, t) => s + t.total, 0)

          await fetch(`${API}/api/sessions/${_sharedActiveSession._backendId}/close`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              closing_cash: (_sharedActiveSession.openingCash || 0) + cashTotal,
            }),
          })
        } catch (err) {
          console.error('Failed to close session on backend:', err)
        }
      }

      const closed = { ..._sharedActiveSession, status: 'closed', endTime: new Date() }
      _sharedSessions     = [closed, ..._sharedSessions]
      _sharedActiveSession = null
      notify()
    }
  }

  function addTransaction(tx) {
    const newTx = {
      ...tx,
      id:         `INV-${String(_invoiceNum).padStart(6, '0')}`,
      invoiceNum: _invoiceNum,
      sessionId:  _sharedActiveSession?.id,
      date:       tx.date || new Date().toISOString(),
    }
    _invoiceNum++
    _sharedTransactions = [newTx, ..._sharedTransactions]
    if (_sharedActiveSession) {
      _sharedActiveSession = {
        ..._sharedActiveSession,
        transactions: [newTx, ...(_sharedActiveSession.transactions || [])],
      }
    }
    notify()
    return newTx
  }

  function addPurchase(purchase) {
    const newP = {
      ...purchase,
      id:        Date.now(),
      date:      new Date().toISOString(),
      sessionId: _sharedActiveSession?.id,
    }
    _sharedPurchases = [newP, ..._sharedPurchases]
    notify()
    showToast('Purchase saved successfully')
    return newP
  }

  function updatePurchase(id, updates) {
    _sharedPurchases = _sharedPurchases.map(p => p.id === id ? { ...p, ...updates } : p)
    notify()
    showToast('Purchase updated')
  }

  const shared = getSharedState()

  const ctxValue = {
    role, active, setActive,
    token,                                          // expose token so child pages can call API
    theme, setTheme,
    productView, setProductView,
    tax, setTax,
    customerName, setCustomerName,
    products:     shared.products,     setProducts,
    transactions: shared.transactions, addTransaction, setTransactions,
    purchases:    shared.purchases,    addPurchase, updatePurchase,
    sessions:     shared.sessions,
    session:      shared.activeSession,
    startSession, endSession, closeSession,
    showToast,
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const now     = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  if (!role) return (
    <AppContext.Provider value={ctxValue}>
      <LoginPage onLogin={handleLogin} />
      {toast && <Toast toast={toast} />}
    </AppContext.Provider>
  )

  if (role === 'cashier' && active === 'session-start') return (
    <AppContext.Provider value={ctxValue}>
      <SessionStartPage onStart={startSession} />
      {toast && <Toast toast={toast} />}
    </AppContext.Provider>
  )

  const adminPages = {
    dashboard: <DashboardPage />,
    products:  <ProductsPage />,
    purchases: <PurchasesPage />,
    inventory: <InventoryPage />,
    reports:   <ReportsPage />,
    history:   <HistoryPage />,
    sessions:  <SessionPage />,
    settings:  <SettingsPage />,
  }
  const cashierPages = {
    billing:   <BillingPage />,
    inventory: <InventoryPage />,
    reports:   <ReportsPage />,
    history:   <HistoryPage />,
    sessions:  <SessionPage />,
    settings:  <SettingsPage />,
  }
  const pages = role === 'admin' ? adminPages : cashierPages

  const todayTx    = shared.transactions.filter(t => new Date(t.date).toDateString() === now.toDateString())
  const totalSales = todayTx.reduce((s, t) => s + t.total, 0)

  const mainContent = active === 'session-end'
    ? <SessionEndPage />
    : (pages[active] ?? <div style={{ padding: 20, color: 'var(--muted)' }}>Coming soon</div>)

  return (
    <AppContext.Provider value={ctxValue}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ height: 42, background: 'var(--bg1)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            <i className="ti ti-calendar" style={{ marginRight: 4 }}></i>{dateStr}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
            {role === 'cashier' && [['F1', 'Help'], ['F2', 'Hold'], ['F3', 'Pay']].map(([k, l]) => (
              <span key={k}><kbd style={{ fontFamily: 'inherit' }}>{k}</kbd> {l}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--green)' }}>
            <i className="ti ti-wifi" style={{ marginRight: 4 }}></i>Online · Synced
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Sidebar
            role={role} active={active} setActive={setActive}
            onLogout={() => { setRole(null); setToken(null); _sharedActiveSession = null; notify() }}
            session={shared.activeSession}
            onEndSession={endSession}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg0)' }}>
            {mainContent}
          </div>
        </div>

        {/* Status bar */}
        <div style={{ height: 36, background: 'var(--bg1)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {shared.activeSession ? (
              <span style={{ color: 'var(--green)' }}>
                <i className="ti ti-clock" style={{ marginRight: 4 }}></i>Session Active · Opening ₹{shared.activeSession.openingCash}
              </span>
            ) : role === 'cashier' ? <span style={{ color: 'var(--amber)' }}>No active session</span> : <span>Admin Mode</span>}
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--muted)' }}>
            <span><span style={{ color: 'var(--text2)', marginRight: 4 }}>Today</span>{todayTx.length} bills</span>
            <span><span style={{ color: 'var(--text2)', marginRight: 4 }}>Sales</span>₹{totalSales.toLocaleString()}</span>
            <span><span style={{ color: 'var(--text2)', marginRight: 4 }}>Tax</span>{tax}%</span>
          </div>
        </div>
      </div>

      {toast && <Toast toast={toast} />}
    </AppContext.Provider>
  )
}

function Toast({ toast }) {
  const colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--blue)', warning: 'var(--amber)' }
  const color  = colors[toast.type] || 'var(--green)'
  return (
    <div style={{
      position: 'fixed', bottom: 56, right: 20, zIndex: 9999,
      background: 'var(--bg1)', border: `1px solid ${color}`,
      borderRadius: 10, padding: '10px 16px', fontSize: 13,
      color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      animation: 'slideIn 0.2s ease',
    }}>
      <span style={{ color, fontSize: 16 }}>
        {toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : toast.type === 'info' ? 'ℹ' : '✓'}
      </span>
      {toast.msg}
    </div>
  )
}
