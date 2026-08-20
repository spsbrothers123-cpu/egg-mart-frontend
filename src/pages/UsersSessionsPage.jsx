import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../App'
import { getUsers, updateUser, getAllSessions } from '../api'
import { inputStyle } from '../components/UI'
import { formatDuration, StatCard, SessionRow } from './SessionPage'

// Admin's "Users & Sessions" page — supersedes the old flat "Sessions" menu.
// Shows a dynamic (never hardcoded) list of the admin's cashiers grouped by
// shop location, lets the admin drill into one cashier's session history,
// and edit that cashier's display name.
//
// Backend dependency: GET /api/users?role=cashier and PATCH /api/users/:id
// are not yet confirmed to exist server-side (see api.js for the documented
// contract). This page fails gracefully — with a clear message, not fake
// data — if those endpoints aren't available yet.
export default function UsersSessionsPage() {
  const { token, showToast } = useApp()

  const [cashiers, setCashiers] = useState(null)   // null = loading, [] = loaded empty
  const [loadErr,  setLoadErr]  = useState('')
  const [allSessions, setAllSessions] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    getUsers({ role: 'cashier' })
      .then(data => { if (!cancelled) setCashiers(Array.isArray(data) ? data : []) })
      .catch(err => { if (!cancelled) { setCashiers([]); setLoadErr(err.message || 'Could not load cashiers') } })

    getAllSessions()
      .then(data => { if (!cancelled) setAllSessions(Array.isArray(data) ? data : []) })
      .catch(() => { if (!cancelled) setAllSessions([]) })

    return () => { cancelled = true }
  }, [token])

  // Group dynamically by whatever shop_location values actually exist —
  // never a hardcoded shop list.
  const shopGroups = useMemo(() => {
    const groups = {}
    for (const c of cashiers || []) {
      const shop = c.shop_location || 'Unassigned'
      if (!groups[shop]) groups[shop] = []
      groups[shop].push(c)
    }
    return groups
  }, [cashiers])

  const selectedCashier = (cashiers || []).find(c => c.id === selectedId) || null

  function handleRename(newName) {
    setCashiers(prev => prev.map(c => c.id === selectedId ? { ...c, name: newName } : c))
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
      {/* Cashier list, grouped by shop */}
      <div style={{
        width: 260, flexShrink: 0, borderRight: '1px solid var(--border)',
        overflowY: 'auto', padding: 16,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
          <i className="ti ti-users-group" style={{ marginRight: 8, color: 'var(--green)' }} />
          Users &amp; Sessions
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
          {cashiers ? `${cashiers.length} cashier${cashiers.length !== 1 ? 's' : ''}` : 'Loading…'}
        </div>

        {loadErr && (
          <div style={{ fontSize: 12, color: 'var(--amber)', background: '#2a1f0a', border: '1px solid #4a3a10', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
            <i className="ti ti-alert-triangle" style={{ marginRight: 6 }}></i>
            Cashier list isn't available yet ({loadErr}). This needs the <code>GET /api/users</code> backend endpoint.
          </div>
        )}

        {cashiers && cashiers.length === 0 && !loadErr && (
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>No cashiers yet.</div>
        )}

        {Object.entries(shopGroups).map(([shop, list]) => (
          <div key={shop} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <i className="ti ti-building-store" style={{ fontSize: 12 }}></i>{shop}
            </div>
            {list.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 8, marginBottom: 2,
                  background: selectedId === c.id ? 'var(--green-dim)' : 'transparent',
                  color: selectedId === c.id ? 'var(--green)' : 'var(--text2)',
                  border: 'none', cursor: 'pointer', fontSize: 13, textAlign: 'left',
                }}
              >
                <i className="ti ti-user" style={{ fontSize: 14 }}></i>
                {c.name || c.username}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {!selectedCashier ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', marginTop: 60 }}>
            <i className="ti ti-user-search" style={{ fontSize: 36, display: 'block', margin: '0 auto 10px', opacity: 0.4 }} />
            Select a cashier to view their session history
          </div>
        ) : (
          <CashierDetail
            cashier={selectedCashier}
            sessions={allSessions.filter(s =>
              s.user_id ? s.user_id === selectedCashier.id : s.cashier_name === (selectedCashier.name || selectedCashier.username)
            )}
            onRenamed={handleRename}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  )
}

function CashierDetail({ cashier, sessions, onRenamed, showToast }) {
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState(cashier.name || cashier.username)
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState('')

  useEffect(() => {
    setNameDraft(cashier.name || cashier.username)
    setEditing(false)
    setSaveErr('')
  }, [cashier.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!nameDraft.trim()) { setSaveErr('Name cannot be empty'); return }
    setSaving(true)
    setSaveErr('')
    try {
      await updateUser(cashier.id, { name: nameDraft.trim() })
      onRenamed(nameDraft.trim())
      setEditing(false)
      showToast('Cashier name updated')
    } catch (e) {
      setSaveErr(e.message || 'Could not save — this needs the PATCH /api/users/:id backend endpoint.')
    } finally {
      setSaving(false)
    }
  }

  const totalRevenue = sessions.reduce((s, sess) => s + parseFloat(sess.total_revenue || 0), 0)
  const totalDaySec  = sessions.reduce((s, sess) => s + (sess.duration_seconds ?? 0), 0)
  const [expandedId, setExpandedId] = useState(null)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: 'var(--green-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2d5a3a',
        }}>
          <i className="ti ti-user" style={{ fontSize: 22, color: 'var(--green)' }}></i>
        </div>
        <div style={{ flex: 1 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                autoFocus
                style={{ ...inputStyle, width: 220 }}
              />
              <button onClick={handleSave} disabled={saving} style={{
                padding: '8px 12px', borderRadius: 8, background: 'var(--green)', color: '#0a1a0a',
                border: 'none', fontSize: 12, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }}></i> : 'Save'}
              </button>
              <button onClick={() => { setEditing(false); setNameDraft(cashier.name || cashier.username); setSaveErr('') }} style={{
                padding: '8px 12px', borderRadius: 8, background: 'var(--bg2)', color: 'var(--text2)',
                border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer',
              }}>Cancel</button>
            </div>
          ) : (
            <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              {cashier.name || cashier.username}
              <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}>
                <i className="ti ti-edit"></i>
              </button>
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            <i className="ti ti-building-store" style={{ marginRight: 4 }}></i>
            {cashier.shop_location || 'Unassigned'}
            <span style={{ margin: '0 6px' }}>·</span>
            @{cashier.username}
          </div>
          {saveErr && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>{saveErr}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon="calendar-event" label="Total Sessions" value={sessions.length} color="var(--blue)" />
        <StatCard icon="clock" label="Total Duration" value={formatDuration(totalDaySec)} color="var(--amber)" />
        <StatCard icon="currency-rupee" label="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} color="var(--green)" />
      </div>

      <div style={{ background: 'var(--bg2)', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
          Session History
        </div>
        {sessions.length === 0 ? (
          <div style={{ padding: '30px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No sessions recorded for this cashier yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  {['Day', 'Date & Time', 'Duration', 'Revenue', 'Status'].map(col => (
                    <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <SessionRow
                    key={s.id || i} session={s} index={i} showCashier={false}
                    expanded={expandedId === (s.id || i)}
                    onToggle={() => setExpandedId(expandedId === (s.id || i) ? null : (s.id || i))}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
