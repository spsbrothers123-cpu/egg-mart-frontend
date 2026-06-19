import { EggIcon } from './UI'

const ADMIN_NAV = [
  { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard'  },
  { id: 'products',  icon: 'eggs',             label: 'Products'   },
  { id: 'purchases', icon: 'shopping-cart',    label: 'Purchases'  },
  { id: 'inventory', icon: 'box',              label: 'Inventory'  },
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

export default function Sidebar({ role, active, setActive, onLogout, session, onEndSession }) {
  const nav = role === 'admin' ? ADMIN_NAV : CASHIER_NAV

  return (
    <div style={{
      width: 200, background: 'var(--bg1)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
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
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {nav.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8,
            background: active === item.id ? 'var(--green-dim)' : 'transparent',
            color:      active === item.id ? 'var(--green)'     : 'var(--text2)',
            border: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: active === item.id ? 500 : 400, marginBottom: 2,
            transition: 'background 0.15s, color 0.15s',
          }}>
            <i className={`ti ti-${item.icon}`} style={{ fontSize: 16 }}></i>
            {item.label}
          </button>
        ))}
      </div>

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
}
