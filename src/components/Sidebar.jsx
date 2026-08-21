import { useState, useEffect } from 'react'
import { EggIcon } from './UI'

const ADMIN_NAV = [
  { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard'  },
  { id: 'products',  icon: 'eggs',             label: 'Products'   },
  { id: 'purchases', icon: 'shopping-cart',    label: 'Purchases'  },
  { id: 'inventory', icon: 'box',              label: 'Inventory'  },
  { id: 'credits',   icon: 'credit-card-pay',  label: 'Credits'    },
  { id: 'reports',   icon: 'chart-bar',        label: 'Reports'    },
  { id: 'history',   icon: 'history',          label: 'History'    },
  { id: 'sessions',  icon: 'calendar-stats',   label: 'Sessions'   },
  { id: 'settings',  icon: 'settings',         label: 'Settings'   },
]

const CASHIER_NAV = [
  { id: 'billing',   icon: 'receipt',          label: 'Billing'   },
  { id: 'inventory', icon: 'box',              label: 'Inventory' },
  { id: 'reports',   icon: 'chart-bar',        label: 'Reports'   },
  { id: 'history',   icon: 'history',          label: 'History'   },
  { id: 'sessions',  icon: 'calendar-stats',   label: 'Sessions'  },
  { id: 'settings',  icon: 'settings',         label: 'Settings'  },
]

// Shared mobile state (singleton so both Sidebar instances share it)
let _mobileOpen = false
let _mobileListeners = []
function setMobileOpen(val) {
  _mobileOpen = typeof val === 'function' ? val(_mobileOpen) : val
  _mobileListeners.forEach(fn => fn(_mobileOpen))
}
function subscribeMobile(fn) {
  _mobileListeners.push(fn)
  return () => { _mobileListeners = _mobileListeners.filter(l => l !== fn) }
}

export default function Sidebar({ role, active, setActive, onLogout, session, onEndSession, hamburgerOnly }) {
  const nav = role === 'admin' ? ADMIN_NAV : CASHIER_NAV
  const [mobileOpen, setMobileOpenState] = useState(_mobileOpen)

  useEffect(() => subscribeMobile(setMobileOpenState), [])

  // Close drawer on nav
  useEffect(() => { setMobileOpen(false) }, [active])

  // Outside click
  useEffect(() => {
    if (!mobileOpen) return
    function handleClick(e) {
      if (!e.target.closest('#sidebar-drawer') && !e.target.closest('#hamburger-btn')) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [mobileOpen])

  // hamburgerOnly = render only the hamburger button (placed in topbar)
  if (hamburgerOnly) {
    return (
      <button
        id="hamburger-btn"
        onClick={() => setMobileOpen(v => !v)}
        style={{
          display: 'none',
          background: 'none', border: 'none',
          color: 'var(--text)', cursor: 'pointer',
          fontSize: 22, padding: '4px 6px',
          alignItems: 'center', justifyContent: 'center',
        }}
        className="hamburger-btn"
        aria-label="Toggle menu"
      >
        <i className={`ti ti-${mobileOpen ? 'x' : 'menu-2'}`}></i>
      </button>
    )
  }

  const innerContent = (
    <div style={{
      width: 220, background: 'var(--bg1)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Logo */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--green-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--green)',
          }}>
            <EggIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>RBR EGG MART</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{role === 'admin' ? 'Admin Panel' : 'Billing POS'}</div>
          </div>
        </div>
        {/* Close btn — mobile only */}
        <button
          className="sidebar-close-btn"
          onClick={() => setMobileOpen(false)}
          style={{ display: 'none', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20, padding: 4 }}
        >
          <i className="ti ti-x"></i>
        </button>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            background: active === item.id ? 'var(--green-dim)' : 'transparent',
            color:      active === item.id ? 'var(--green)'     : 'var(--text2)',
            border: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: active === item.id ? 600 : 400, marginBottom: 2,
            transition: 'background 0.15s, color 0.15s',
          }}>
            <i className={`ti ti-${item.icon}`} style={{ fontSize: 16 }}></i>
            {item.label}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        {role === 'cashier' && session && (
          <div style={{ padding: '8px 12px', marginBottom: 6, fontSize: 11, color: 'var(--green)', background: 'var(--green-dim)', borderRadius: 6 }}>
            <i className="ti ti-clock" style={{ marginRight: 4 }}></i>Session Active
          </div>
        )}
        {role === 'cashier' && session && (
          <button onClick={onEndSession} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, marginBottom: 4,
            background: 'transparent', color: 'var(--amber)',
            border: '1px solid var(--amber)', cursor: 'pointer', fontSize: 12,
          }}>
            <i className="ti ti-player-stop" style={{ fontSize: 14 }}></i>End Session
          </button>
        )}
        <div style={{ padding: '6px 12px', marginBottom: 4, fontSize: 12, color: 'var(--muted)' }}>
          <i className={`ti ti-${role === 'admin' ? 'shield' : 'user'}`} style={{ marginRight: 6 }}></i>
          <span style={{ textTransform: 'capitalize' }}>{role}</span>
        </div>
        <button onClick={onLogout} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8,
          background: 'transparent', color: 'var(--red)',
          border: 'none', cursor: 'pointer', fontSize: 13,
        }}>
          <i className="ti ti-logout" style={{ fontSize: 16 }}></i>Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: static sidebar */}
      <div className="sidebar-desktop" style={{ flexShrink: 0, height: '100%' }}>
        {innerContent}
      </div>

      {/* Mobile: overlay + drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="sidebar-overlay"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 998, display: 'none' }}
        />
      )}
      <div
        id="sidebar-drawer"
        className="sidebar-drawer"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 999, display: 'none',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.6)',
        }}
      >
        {innerContent}
      </div>
    </>
  )
}
