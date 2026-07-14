import { useState, useEffect } from 'react'
import { useApp } from '../App'
import { getDashboardSummary } from '../api'
import { istDateKey, isTodayIST } from '../dateUtils'

export default function DashboardPage() {
  const { transactions: localTx, products, token } = useApp()
  const [transactions, setTransactions] = useState(localTx)
  // Previously Today's Sales / Total Bills / low-stock count were all
  // re-derived client-side from the full bills list, duplicating logic the
  // backend already computes (and caches) in one round trip, and missing
  // the server-side inventory/low-stock figures. Use it as the source of
  // truth for those numbers; monthly trend and top products still need the
  // full bill history, which the summary endpoint intentionally doesn't include.
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    if (!token) return
    getDashboardSummary().then(setSummary).catch(err => console.error('Dashboard summary error:', err))
  }, [token])

  // ── Fix #1: Fetch latest sales from backend (same as Reports/History) ──────
  useEffect(() => {
    if (!token) { setTransactions(localTx); return }
    fetch(`${import.meta.env.VITE_API_URL}/api/bills`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setTransactions(data.map(b => ({
          ...b,
          date:     b.created_at,
          total:    parseFloat(b.total),
          method:         b.settled_method || b.payment_method,
          payment_method: b.payment_method,
          customer: b.customer_name || 'Walk-in Customer',
          items:    b.item_count ?? (b.items?.length ?? 0),
          cart:     b.items ?? [],
        })))
        else setTransactions(localTx)
      })
      .catch(() => setTransactions(localTx))
  }, [token])

  const now     = new Date()
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

  /* ── Today's stats — prefer the backend summary when available ── */
  const todayTx    = transactions.filter(t => isTodayIST(t.date))
  const totalSales = summary ? summary.sales.revenue     : todayTx.reduce((s, t) => s + t.total, 0)
  const billCount   = summary ? summary.sales.bill_count : todayTx.length
  const totalItems = todayTx.reduce((s, t) => s + (t.items || 0), 0)
  const avgBill    = billCount > 0 ? Math.round(totalSales / billCount) : 0

  /* ── Monthly bar chart (last 12 months) ── */
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    const monthStr = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
    const total = transactions
      .filter(t => {
        const td = new Date(t.date)
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear()
      })
      .reduce((s, t) => s + t.total, 0)
    return { label: monthStr, total }
  })
  const maxMonth = Math.max(...monthly.map(m => m.total), 1)

  /* ── Top selling products ── */
  const productSales = {}
  transactions.forEach(tx => {
    if (!tx.cart) return
    tx.cart.forEach(item => {
      productSales[item.name] = (productSales[item.name] || 0) + item.qty
    })
  })
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, sold]) => ({ name, sold }))
  const maxSold = Math.max(...topProducts.map(p => p.sold), 1)

  /* ── Low stock ── */
  const lowStock = products.filter(p => p.stock < 50)

  /* ── Recent transactions ── */
  const recentTx = transactions.slice(0, 4)

  const STATS = [
    { label: "Today's Sales", value: `₹${totalSales.toLocaleString()}`, icon: 'trending-up',  color: 'var(--green)'  },
    { label: 'Total Bills',   value: billCount,                         icon: 'receipt',      color: 'var(--blue)'   },
    { label: 'Items Sold',    value: totalItems,                        icon: 'eggs',         color: 'var(--amber)'  },
    { label: 'Avg. Bill',     value: avgBill > 0 ? `₹${avgBill}` : '—', icon: 'chart-bar',  color: 'var(--purple)' },
  ]

  return (
    <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Dashboard</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{dateStr} · Good morning, Admin</div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {STATS.map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
              <i className={`ti ti-${s.icon}`} style={{ fontSize: 18, color: s.color }}></i>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Monthly trend */}
        <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Monthly Sales Trend</div>
          {monthly.every(m => m.total === 0) ? (
            <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 12 }}>
              No sales data yet
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
              {monthly.map((m, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{
                    width: '100%', borderRadius: '3px 3px 0 0',
                    background: i === 11 ? 'var(--green)' : 'var(--bg3)',
                    height: `${Math.max((m.total / maxMonth) * 70, m.total > 0 ? 4 : 0)}px`,
                  }}></div>
                  <div style={{ fontSize: 9, color: 'var(--muted)' }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top Selling Products</div>
          {topProducts.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 12, paddingTop: 8 }}>No sales data yet</div>
          ) : topProducts.map((p, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: 'var(--text2)' }}>{p.name}</span>
                <span style={{ color: 'var(--muted)' }}>{p.sold} sold</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--bg3)' }}>
                <div style={{ height: '100%', borderRadius: 3, background: 'var(--green)', width: `${(p.sold / maxSold) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low stock + Recent transactions */}
      <div className="bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--amber)' }}>
            <i className="ti ti-alert-triangle" style={{ marginRight: 6 }}></i>Low Stock Alerts
          </div>
          {lowStock.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>All products well stocked</div>
          ) : lowStock.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13 }}>{p.emoji} {p.name} ({p.pack})</span>
              <span style={{ fontSize: 12, color: p.stock < 30 ? 'var(--red)' : 'var(--amber)', fontWeight: 600 }}>{p.stock} left</span>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent Transactions</div>
          {recentTx.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>No transactions yet</div>
          ) : recentTx.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 12, fontFamily: "'DM Mono'", color: 'var(--green)' }}>{t.id}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {t.customer} · {new Date(t.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>₹{t.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
