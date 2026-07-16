import { useState, useEffect } from 'react'
import { useApp } from '../App'

const DENOMS = [
  { value: 500, label: '₹500', color: 'var(--green)',  bg: 'var(--green-dim)' },
  { value: 200, label: '₹200', color: 'var(--blue)',   bg: '#0a1428' },
  { value: 100, label: '₹100', color: 'var(--amber)',  bg: '#2a1f0a' },
  { value:  50, label: '₹50',  color: 'var(--purple)', bg: '#1a0f28' },
]

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', padding: '20px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        }}>
          <i className={`ti ti-${icon}`} style={{ fontSize: 18, color }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function DrawerBreakdown({ counts }) {
  if (!counts) return null
  const total = DENOMS.reduce((sum, d) => sum + (parseInt(counts[d.value]) || 0) * d.value, 0)
  if (total === 0 && DENOMS.every(d => !counts[d.value])) return null

  return (
    <div style={{
      marginTop: 12,
      background: 'var(--bg0)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
        <i className="ti ti-building-bank" style={{ marginRight: 5, color: 'var(--amber)' }}></i>
        Drawer Count
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
        {DENOMS.map(d => {
          const qty = parseInt(counts[d.value]) || 0
          return (
            <div key={d.value} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: d.bg, border: `1px solid ${d.color}20`,
              borderRadius: 7, padding: '6px 10px',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: d.color }}>{d.label}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>×{qty}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: qty > 0 ? d.color : 'var(--muted)' }}>
                ₹{(qty * d.value).toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid var(--border)', paddingTop: 8,
      }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Total Counted</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--green)' }}>₹{total.toLocaleString()}</span>
      </div>
    </div>
  )
}

function SessionRow({ session, index, showCashier, expanded, onToggle }) {
  const openedAt  = new Date(session.opened_at || session.date)
  const closedAt  = session.closed_at ? new Date(session.closed_at) : null
  const durationSec = session.duration_seconds
    ?? (closedAt ? Math.floor((closedAt - openedAt) / 1000) : Math.floor((Date.now() - openedAt) / 1000))
  const revenue   = parseFloat(session.total_revenue || 0)
  const billCount = session.bill_count ?? 0
  const isOpen    = session.status === 'open' || session.status === 'active'
  const parsedCounts = session.drawer_counts
    ? (typeof session.drawer_counts === 'string' ? JSON.parse(session.drawer_counts) : session.drawer_counts)
    : null
  const hasCounts = parsedCounts && Object.values(parsedCounts).some(v => parseInt(v) > 0)

  return (
    <>
      <tr
        style={{ borderBottom: expanded ? 'none' : '1px solid var(--border)', cursor: hasCounts ? 'pointer' : 'default' }}
        onClick={hasCounts ? onToggle : undefined}
      >
        <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>
          Day {index + 1}
          {hasCounts && (
            <i className={`ti ti-chevron-${expanded ? 'up' : 'down'}`}
              style={{ marginLeft: 6, fontSize: 11, color: 'var(--amber)' }}></i>
          )}
        </td>
        <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--muted)' }}>
          {openedAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          <br />
          <span style={{ fontSize: 11 }}>
            {openedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            {closedAt && ` – ${closedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </td>
        <td style={{ padding: '13px 16px', fontSize: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="ti ti-clock" style={{ color: 'var(--blue)', fontSize: 14 }} />
            {formatDuration(durationSec)}
          </span>
        </td>
        <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>
          ₹{(revenue ?? 0).toLocaleString('en-IN')}
          <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>{billCount} bill{billCount !== 1 ? 's' : ''}</div>
        </td>
        <td style={{ padding: '13px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{
              fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
              background: isOpen ? 'var(--green-dim)' : 'var(--bg3)',
              color: isOpen ? 'var(--green)' : 'var(--muted)',
              border: `1px solid ${isOpen ? 'var(--green)' : 'var(--border)'}`,
              display: 'inline-block', width: 'fit-content',
            }}>
              {isOpen ? '● Active' : 'Closed'}
            </span>
            {hasCounts && (
              <span style={{ fontSize: 10, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <i className="ti ti-building-bank" style={{ fontSize: 10 }}></i>Drawer counted
              </span>
            )}
          </div>
        </td>
        {showCashier && (
          <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--muted)' }}>
            <i className="ti ti-user" style={{ marginRight: 4 }} />
            {session.cashier_name}
          </td>
        )}
      </tr>
      {expanded && hasCounts && (
        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
          <td colSpan={showCashier ? 6 : 5} style={{ padding: '0 16px 14px 16px' }}>
            <DrawerBreakdown counts={parsedCounts} />
          </td>
        </tr>
      )}
    </>
  )
}

export default function SessionPage() {
  const { sessions: localSessions, session: activeSession, role, token } = useApp()
  const [expandedId, setExpandedId] = useState(null)
  const [backendSessions, setBackendSessions] = useState(null)

  useEffect(() => {
    if (!token) return
    // Admins see every cashier's sessions; cashiers see their own —
    // both endpoints already exist on the backend, just weren't both wired up.
    const endpoint = role === 'admin' ? '/api/sessions' : '/api/sessions/my'
    fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBackendSessions(data) })
      .catch(() => {})
  }, [token, role])

  const sessions = backendSessions ?? localSessions

  const activeWithRevenue = activeSession ? [{
    ...activeSession,
    status: 'open',
    total_revenue: (activeSession.transactions || []).reduce((s, t) => s + (t.total || 0), 0),
    bill_count: (activeSession.transactions || []).length,
  }] : []

  const allSessions = [...activeWithRevenue, ...sessions]

  const totalDaySec  = allSessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0)
  const totalRevenue = allSessions.reduce((sum, s) => sum + parseFloat(s.total_revenue || 0), 0)
  const totalBills   = allSessions.reduce((sum, s) => sum + (s.bill_count ?? 0), 0)
  const showCashier  = role === 'admin'

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 24 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          <i className="ti ti-calendar-stats" style={{ marginRight: 10, color: 'var(--green)' }} />
          Session History
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Overview of all sessions · {allSessions.length} session{allSessions.length !== 1 ? 's' : ''} recorded
          {allSessions.some(s => s.drawer_counts) && (
            <span style={{ marginLeft: 10, color: 'var(--amber)' }}>
              <i className="ti ti-building-bank" style={{ marginRight: 4 }}></i>
              Click a row with <strong>Drawer counted</strong> badge to see denomination breakdown
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard
          icon="calendar-event"
          label="Total Sessions"
          value={allSessions.length}
          sub={`${allSessions.filter(s => s.status === 'active' || s.status === 'open').length} currently active`}
          color="var(--blue)"
        />
        <StatCard
          icon="clock"
          label="Total Duration"
          value={formatDuration(totalDaySec)}
          sub={`Across all ${allSessions.length} sessions`}
          color="var(--amber)"
        />
        <StatCard
          icon="currency-rupee"
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          sub={`${totalBills} total bills`}
          color="var(--green)"
        />
      </div>

      <div style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-list-details" style={{ color: 'var(--blue)', fontSize: 16 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Session Log</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', background: 'var(--bg3)', padding: '2px 8px', borderRadius: 20 }}>
            View only
          </span>
        </div>

        {allSessions.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            <i className="ti ti-calendar-off" style={{ fontSize: 36, display: 'block', marginBottom: 10, opacity: 0.4 }} />
            No sessions recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  {['Day', 'Date & Time', 'Duration', 'Revenue', 'Status',
                    ...(showCashier ? ['Cashier'] : [])
                  ].map(col => (
                    <th key={col} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, color: 'var(--muted)',
                      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allSessions.map((s, i) => (
                  <SessionRow
                    key={s.id || i}
                    session={s}
                    index={i}
                    showCashier={showCashier}
                    expanded={expandedId === (s.id || i)}
                    onToggle={() => setExpandedId(expandedId === (s.id || i) ? null : (s.id || i))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{
        marginTop: 16, padding: '10px 16px', borderRadius: 8,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)',
      }}>
        <i className="ti ti-lock" style={{ color: 'var(--amber)', fontSize: 15 }} />
        Session data is read-only and cannot be modified.
      </div>
    </div>
  )
}
