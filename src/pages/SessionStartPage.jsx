import { useState } from 'react'
import { EggIcon } from '../components/UI'

// Denomination tiles shown in the drawer count grid
const DENOMINATIONS = [
  { value: 500, color: '#4ade80',  dimColor: '#052e16', label: '₹500' },
  { value: 200, color: '#60a5fa',  dimColor: '#0c1a3a', label: '₹200' },
  { value: 100, color: '#fbbf24',  dimColor: '#2a1a00', label: '₹100' },
  { value: 50,  color: '#a78bfa',  dimColor: '#1a0a3a', label: '₹50'  },
  { value: 20,  color: '#34d399',  dimColor: '#052e1a', label: '₹20'  },
  { value: 10,  color: '#f87171',  dimColor: '#2a0a0a', label: '₹10'  },
]

export default function SessionStartPage({ onStart }) {
  // counts[500] = number of ₹500 notes in drawer, etc.
  const [counts, setCounts] = useState(
    Object.fromEntries(DENOMINATIONS.map(d => [d.value, 0]))
  )
  const [loading, setLoading] = useState(false)

  function setCount(denom, raw) {
    const n = Math.max(0, parseInt(raw) || 0)
    setCounts(prev => ({ ...prev, [denom]: n }))
  }

  // Total cash = sum of (notes × denomination)
  const openingCash = DENOMINATIONS.reduce((sum, d) => sum + counts[d.value] * d.value, 0)

  async function handleStart() {
    setLoading(true)
    // Build drawer_counts payload for the backend — plain numeric keys
    // (500, 200, 100, 50, ...) so it matches the shape SessionPage's
    // DrawerBreakdown reads (counts[d.value]) and the shape SessionEndPage
    // already sends for the closing count.
    const drawerCounts = Object.fromEntries(
      DENOMINATIONS.map(d => [d.value, counts[d.value]])
    )
    await onStart(openingCash, drawerCounts)
    setLoading(false)
  }

  const now = new Date()

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg0)',
    }}>
      <div style={{
        width: 480, padding: '2rem', background: 'var(--bg1)',
        borderRadius: 16, border: '1px solid var(--border)', textAlign: 'center',
      }}>

        {/* Header */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: 'var(--green-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem', border: '1px solid var(--green)',
        }}>
          <EggIcon size={32} />
        </div>

        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>
          Start Cashier Session
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>RBR Egg Mart POS</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>
          {now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
          {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* Drawer count section */}
        <div style={{
          background: 'var(--bg2)', borderRadius: 12,
          border: '1px solid var(--border)', padding: '16px', marginBottom: 16, textAlign: 'left',
        }}>
          <div style={{
            fontSize: 11, color: 'var(--muted)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <i className="ti ti-cash-register" style={{ fontSize: 13 }}></i>
            Opening Drawer Count
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {DENOMINATIONS.map(d => {
              const subtotal = counts[d.value] * d.value
              return (
                <div key={d.value} style={{
                  background: d.dimColor,
                  border: `1px solid ${d.color}22`,
                  borderRadius: 10, padding: '12px',
                }}>
                  {/* Top row: denomination + subtotal */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 8,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>
                      {d.label}
                    </span>
                    <span style={{ fontSize: 12, color: subtotal > 0 ? d.color : 'var(--muted)' }}>
                      = ₹{subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Note count input */}
                  <input
                    type="number"
                    min="0"
                    value={counts[d.value] === 0 ? '' : counts[d.value]}
                    placeholder="0"
                    onChange={e => setCount(d.value, e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px', borderRadius: 7,
                      border: `1px solid ${d.color}33`,
                      background: 'rgba(0,0,0,0.25)',
                      color: d.color, fontSize: 18, fontWeight: 700,
                      textAlign: 'center', outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, textAlign: 'center' }}>
                    notes × {d.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Opening Cash Total */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 4px', marginBottom: 16,
          borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Opening Cash Total</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>
            ₹{openingCash.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 10,
            background: loading ? 'var(--green-dim)' : 'var(--green)',
            color: '#0a1a0a', fontSize: 15, fontWeight: 700,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'opacity 0.15s',
          }}
        >
          {loading
            ? <><i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }}></i> Starting…</>
            : <><i className="ti ti-player-play"></i> Start Session · ₹{openingCash.toLocaleString('en-IN')} Opening</>
          }
        </button>

        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
          Session will track all sales, transactions, and cash flow.
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
