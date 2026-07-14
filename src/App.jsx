import { useState, useEffect, createContext, useContext, useCallback, lazy, Suspense } from 'react'
import LoginPage from './pages/LoginPage'
import Sidebar   from './components/Sidebar'
import SessionStartPage from './pages/SessionStartPage'
import { getToken as getPersistedToken, setToken as persistToken, clearToken as clearPersistedToken } from './api'
import { isTodayIST } from './dateUtils'

// Lazy-loaded pages: each becomes its own bundle chunk fetched only when the
// user navigates to it, instead of all pages shipping in the initial bundle.
// This cuts first-load JS substantially since Billing/Purchases/OtherPages
// alone are ~100KB combined of source.
const BillingPage   = lazy(() => import('./pages/BillingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProductsPage  = lazy(() => import('./pages/ProductsPage'))
const PurchasesPage = lazy(() => import('./pages/PurchasesPage'))
const SessionPage   = lazy(() => import('./pages/SessionPage'))
const ReportsPage    = lazy(() => import('./pages/OtherPages').then(m => ({ default: m.ReportsPage })))
const CreditsPage    = lazy(() => import('./pages/OtherPages').then(m => ({ default: m.CreditsPage })))
const InventoryPage  = lazy(() => import('./pages/OtherPages').then(m => ({ default: m.InventoryPage })))
const HistoryPage    = lazy(() => import('./pages/OtherPages').then(m => ({ default: m.HistoryPage })))
const SettingsPage   = lazy(() => import('./pages/OtherPages').then(m => ({ default: m.SettingsPage })))
const SessionEndPage = lazy(() => import('./pages/OtherPages').then(m => ({ default: m.SessionEndPage })))

import { PRODUCTS as DEFAULT_PRODUCTS } from './data'

function PageLoadingFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)' }}>
      Loading…
    </div>
  )
}

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

// Billing cart / held bills previously lived only in BillingPage's local
// state, so switching tabs (App.jsx swaps which lazy component is mounted)
// silently wiped any in-progress cart or held bills with no warning. Lifting
// them up here means they survive navigating away and back.
let _sharedCart             = []
let _sharedHeldBills        = []
let _sharedBillCustomerName = ''
let _sharedBillDiscount     = 0

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
    cart:             _sharedCart,
    heldBills:        _sharedHeldBills,
    billCustomerName: _sharedBillCustomerName,
    billDiscount:     _sharedBillDiscount,
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

  const loadProducts = useCallback(async (tok) => {
    const authToken = tok ?? token
    if (!authToken) return
    try {
      const res = await fetch(`${API}/api/products`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      })
      if (!res.ok) return
      const data = await res.json()
      // Normalize backend shape (price/stock as strings from Postgres numeric)
      // into the numeric shape the rest of the app already expects.
      _sharedProducts = (Array.isArray(data) ? data : []).map(p => ({
        ...p,
        price: Number(p.price),
        stock: Number(p.stock),
        category: p.category_slug ?? p.category ?? 'other',
      }))
      notify()
    } catch (err) {
      console.error('Failed to load products from backend:', err)
      // Leave whatever _sharedProducts currently holds (static fallback or
      // last-known-good) rather than clearing it on a transient network blip.
    }
  }, [token])

  // Refetch the real product list whenever we have a token (fresh login or
  // restored session) — this is the fix for the root-cause bug where the
  // app ran entirely off the static hardcoded catalog and never called the
  // backend, so prices/stock shown to the cashier were never the real
  // values and stock reset to seed defaults on every refresh.
  useEffect(() => {
    if (token) loadProducts(token)
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

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
  function setCart(updater) {
    _sharedCart = typeof updater === 'function' ? updater(_sharedCart) : updater
    notify()
  }
  function setHeldBills(updater) {
    _sharedHeldBills = typeof updater === 'function' ? updater(_sharedHeldBills) : updater
    notify()
  }
  function setBillCustomerName(v) {
    _sharedBillCustomerName = v
    notify()
  }
  function setBillDiscount(v) {
    _sharedBillDiscount = v
    notify()
  }

  // ─── Auth ────────────────────────────────────────────────────────────────
  function handleLogin(r, tok) {
    setRole(r)
    setToken(tok || null)                           // store the JWT token
    persistToken(tok || null)                        // ...and survive a refresh
    setActive(r === 'admin' ? 'dashboard' : 'session-start')
  }

  function handleLogout() {
    setRole(null)
    setToken(null)
    clearPersistedToken()
    _sharedActiveSession = null
    notify()
  }

  // Restore a session on page load if a token survived a refresh. Previously
  // the token lived only in React state (`let _token = null` in api.js was
  // never written to storage either), so any refresh silently logged the
  // user out and dropped whatever was in the cart / held bills.
  const [restoring, setRestoring] = useState(true)
  useEffect(() => {
    const saved = getPersistedToken()
    if (!saved) { setRestoring(false); return }

    ;(async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${saved}` },
        })
        if (!res.ok) throw new Error('Session expired')
        const user = await res.json()
        setRole(user.role)
        setToken(saved)

        // If a cashier already has an open session on the backend, resume
        // straight into billing instead of asking them to open a new one.
        if (user.role === 'cashier') {
          try {
            const curRes = await fetch(`${API}/api/sessions/current`, {
              headers: { 'Authorization': `Bearer ${saved}` },
            })
            if (curRes.ok) {
              const s = await curRes.json()
              _sharedActiveSession = {
                id: s.id, date: s.opened_at, dateStr: new Date(s.opened_at).toDateString(),
                openingCash: Number(s.opening_cash), startTime: new Date(s.opened_at),
                transactions: [], status: 'active', _backendId: s.id,
              }
              setActive('billing')
            } else {
              setActive('session-start')
            }
          } catch {
            setActive('session-start')
          }
        } else {
          setActive('dashboard')
        }
      } catch (err) {
        console.error('Could not restore session:', err)
        clearPersistedToken()
      } finally {
        setRestoring(false)
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

          // ── Step 2: reconcile against actual transactions, then close ────
          // Previously this assumed zero cash was collected during the
          // stale session (closing_cash = opening_cash), which misreports
          // the drawer total if real sales happened before the stale
          // session was caught. Instead, sum actual cash bills placed
          // between when the session opened and now.
          const openedAt = new Date(existing.opened_at)
          const nowDate   = new Date()
          const datesToCheck = new Set([
            openedAt.toISOString().slice(0, 10),
            nowDate.toISOString().slice(0, 10),
          ])

          let reconciledCash = 0
          try {
            for (const d of datesToCheck) {
              const billsRes = await fetch(`${API}/api/bills?date=${d}`, { headers })
              if (!billsRes.ok) continue
              const bills = await billsRes.json()
              for (const b of (Array.isArray(bills) ? bills : [])) {
                const created = new Date(b.created_at)
                if (
                  created >= openedAt && created <= nowDate &&
                  b.payment_method === 'cash' && b.payment_status !== 'voided'
                ) {
                  reconciledCash += Number(b.total)
                }
              }
            }
          } catch (reconcileErr) {
            console.error('Could not reconcile stale session transactions:', reconcileErr)
          }

          const reconciledClosingCash = Number(existing.opening_cash ?? 0) + reconciledCash

          await fetch(`${API}/api/sessions/${existing.id}/close`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              closing_cash:  reconciledClosingCash,
              drawer_counts: null,
            }),
          })
          showToast(
            reconciledCash > 0
              ? `Previous session auto-closed (₹${reconciledCash.toLocaleString()} in cash sales reconciled)`
              : 'Previous session auto-closed',
            'info'
          )
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

  async function closeSession(drawerCounts) {
    if (_sharedActiveSession) {
      // Close on backend if we have a token and a backend session id
      if (token && _sharedActiveSession._backendId) {
        try {
          // Case-insensitive match, consistent with SessionEndPage and
          // ReportsPage — a previous version of this check compared against
          // the exact string 'Cash', which silently under-counts the drawer
          // total the moment the recorded method casing differs (e.g. if it
          // ever comes back from the backend as lowercase 'cash').
          const cashTotal = (_sharedActiveSession.transactions || [])
            .filter(t => t.method?.toLowerCase() === 'cash')
            .reduce((s, t) => s + t.total, 0)

          await fetch(`${API}/api/sessions/${_sharedActiveSession._backendId}/close`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              closing_cash:  (_sharedActiveSession.openingCash || 0) + cashTotal,
              drawer_counts: drawerCounts ?? null,
            }),
          })
        } catch (err) {
          console.error('Failed to close session on backend:', err)
        }
      }

      const closed = { ..._sharedActiveSession, status: 'closed', endTime: new Date(), drawer_counts: drawerCounts ?? null }
      _sharedSessions     = [closed, ..._sharedSessions]
      _sharedActiveSession = null
      notify()
    }
  }

  async function addTransaction(tx) {
  // If we have a token, persist to backend (which deducts stock)
  if (token) {
    try {
      const payload = {
        customer_id:    tx.customerId ?? null,
        items: tx.cart.map(i => ({
          product_id: i.id,
          name:       i.name,
          pack:       i.pack ?? null,
          price:      i.editPrice,
          qty:        i.qty,
        })),
        discount_pct:   tx.discountPct  || 0,
        tax_pct:        tx.tax          ? (tx.tax / tx.subtotal * 100) : 0,
        payment_method: tx.method?.toLowerCase() === 'upi'    ? 'upi'
                       : tx.method?.toLowerCase() === 'card'   ? 'card'
                       : tx.method?.toLowerCase() === 'credit' ? 'credit'
                       : 'cash',
        notes: tx.customer !== 'Walk-in Customer' ? tx.customer : null,
      }

      const res = await fetch(`${API}/api/bills`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.error || 'Failed to save bill', 'error')
        return null
      }

      const bill = await res.json()

      // Deduct stock locally so UI reflects immediately
      setProducts(prev => prev.map(p => {
        const item = tx.cart.find(i => i.id === p.id)
        return item ? { ...p, stock: (p.stock ?? 0) - item.qty } : p
      }))

      const newTx = { ...tx, id: bill.invoice_number, invoiceNum: bill.id, sessionId: _sharedActiveSession?.id }
      _sharedTransactions = [newTx, ..._sharedTransactions]
      if (_sharedActiveSession) {
        _sharedActiveSession = { ..._sharedActiveSession, transactions: [newTx, ...(_sharedActiveSession.transactions || [])] }
      }
      notify()
      return newTx

    } catch (err) {
      console.error('Bill API error:', err)
      showToast('Server error saving bill', 'error')
      return null
    }
  }

  // Offline / no-token fallback (local only)
  const newTx = { ...tx, id: `INV-${String(_invoiceNum).padStart(6, '0')}`, invoiceNum: _invoiceNum, sessionId: _sharedActiveSession?.id }
  _invoiceNum++
  _sharedTransactions = [newTx, ..._sharedTransactions]
  // Deduct stock locally
  setProducts(prev => prev.map(p => {
    const item = tx.cart.find(i => i.id === p.id)
    return item ? { ...p, stock: (p.stock ?? 0) - item.qty } : p
  }))
  if (_sharedActiveSession) {
    _sharedActiveSession = { ..._sharedActiveSession, transactions: [newTx, ...(_sharedActiveSession.transactions || [])] }
  }
  notify()
  return newTx
}

  async function addPurchase(purchase) {
    // If we have a token, persist to backend (which adds stock)
    if (token) {
      try {
        const payload = {
          invoice_no:    purchase.invoiceNo || null,
          supplier:      purchase.supplier  || null,
          purchase_date: purchase.purchaseDate || new Date().toISOString().slice(0, 10),
          gst_pct:       purchase.gstPct || 0,
          items: purchase.items.map(i => ({
            product_id: i.productId ?? null,
            name:       i.name,
            pack:       i.pack ?? null,
            unit_price: i.unitPrice,
            qty:        i.qty,
          })),
          notes: purchase.notes ?? null,
        }

        const res = await fetch(`${API}/api/purchases`, {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          showToast(err.error || 'Failed to save purchase', 'error')
          return null
        }

        const saved = await res.json()

        // Add stock locally so UI reflects immediately
        setProducts(prev => prev.map(p => {
          const item = purchase.items.find(i => i.productId === p.id)
          return item ? { ...p, stock: (p.stock ?? 0) + item.qty } : p
        }))

        const newP = {
          ...purchase,
          id:        saved.id,
          date:      saved.created_at,
          sessionId: _sharedActiveSession?.id,
        }
        _sharedPurchases = [newP, ..._sharedPurchases]
        notify()
        showToast('Purchase saved successfully')
        return newP

      } catch (err) {
        console.error('Purchase API error:', err)
        showToast('Server error saving purchase', 'error')
        return null
      }
    }

    // Offline / no-token fallback (local only)
    const newP = {
      ...purchase,
      id:        Date.now(),
      date:      new Date().toISOString(),
      sessionId: _sharedActiveSession?.id,
    }
    _sharedPurchases = [newP, ..._sharedPurchases]
    setProducts(prev => prev.map(p => {
      const item = purchase.items.find(i => i.productId === p.id)
      return item ? { ...p, stock: (p.stock ?? 0) + item.qty } : p
    }))
    notify()
    showToast('Purchase saved (offline mode)')
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
    refreshProducts: loadProducts,
    transactions: shared.transactions, addTransaction, setTransactions,
    purchases:    shared.purchases,    addPurchase, updatePurchase,
    sessions:     shared.sessions,
    session:      shared.activeSession,
    startSession, endSession, closeSession,
    logout: handleLogout,
    showToast,
    // Lifted billing cart state — persists across tab navigation.
    cart:             shared.cart,             setCart,
    heldBills:        shared.heldBills,        setHeldBills,
    billCustomerName: shared.billCustomerName, setBillCustomerName,
    billDiscount:     shared.billDiscount,     setBillDiscount,
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  const now     = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  if (restoring) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg0)', color: 'var(--muted)' }}>
      Loading…
    </div>
  )

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
    credits:   <CreditsPage />,
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

  const todayTx    = shared.transactions.filter(t => isTodayIST(t.date))
  const totalSales = todayTx.reduce((s, t) => s + t.total, 0)

  const mainContent = active === 'session-end'
    ? <SessionEndPage />
    : (pages[active] ?? <div style={{ padding: 20, color: 'var(--muted)' }}>Coming soon</div>)

  const suspendedMainContent = <Suspense fallback={<PageLoadingFallback />}>{mainContent}</Suspense>

  return (
    <AppContext.Provider value={ctxValue}>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{ height: 48, background: 'var(--bg1)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', flexShrink: 0, gap: 8 }}>
          {/* Hamburger lives here — only visible on mobile via CSS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sidebar
              role={role} active={active} setActive={setActive}
              onLogout={handleLogout}
              session={shared.activeSession}
              onEndSession={endSession}
              hamburgerOnly
            />
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              <i className="ti ti-calendar" style={{ marginRight: 4 }}></i>{dateStr}
            </div>
          </div>
          <div className="topbar-shortcuts" style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
            {role === 'cashier' && [['F1', 'Help'], ['F2', 'Hold'], ['F3', 'Pay']].map(([k, l]) => (
              <span key={k}><kbd style={{ fontFamily: 'inherit' }}>{k}</kbd> {l}</span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--green)', whiteSpace: 'nowrap' }}>
            <i className="ti ti-wifi" style={{ marginRight: 4 }}></i>
            <span className="topbar-synced-text">Online · Synced</span>
          </div>
        </div>

        {/* Body */}
        <div className="app-body" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Sidebar
            role={role} active={active} setActive={setActive}
            onLogout={handleLogout}
            session={shared.activeSession}
            onEndSession={endSession}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg0)' }}>
            {suspendedMainContent}
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
          <div className="statusbar-sales" style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--muted)' }}>
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
