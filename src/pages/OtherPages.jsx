import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { SALES_HISTORY } from '../data'
import { PageHeader, AddButton, TableHeader, SaleBadge, StatusBadge, Modal, FormField, inputStyle, ModalActions } from '../components/UI'
import { useApp } from '../App'
import { getCategories, createProduct, updateProduct, deleteProduct, getBill, getBills, settleCreditBill } from '../api'
import { istDateKey, isTodayIST } from '../dateUtils'

/* ─── Reports ─── */
export function ReportsPage() {
  const { transactions: localTx, token } = useApp()
  const [transactions, setTransactions] = useState(localTx)

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
          customer: b.customer_name,
          status:   b.payment_status,
          items:    b.item_count ?? (b.items?.length ?? 0),
        })))
        else setTransactions(localTx)
      })
      .catch(() => setTransactions(localTx))
  }, [token])

  // Backend `payment_method` values are lowercase ('cash','card','upi',
  // 'net_banking','split','credit' — see bills table CHECK constraint), so
  // matching against capitalized literals here always returned zero results
  // and every "Sales" card showed ₹0 regardless of real transactions.
  //
  // `method` here is the *effective* method — for a settled credit bill
  // that's its settled_method (Cash/UPI/Card), so a credit sale correctly
  // moves into that method's total once it's paid off. Only still-pending
  // credit bills (payment_method='credit' AND status='credit') stay out of
  // the Cash/Card/UPI buckets and show up in the dedicated Credit block below.
  const isPendingCredit = t => t.payment_method?.toLowerCase() === 'credit' && t.status === 'credit'
  const byMethod = (method) => transactions.filter(t => !isPendingCredit(t) && t.method?.toLowerCase() === method)
  const sumAmt   = (arr)    => arr.reduce((s, t) => s + t.total, 0)

  const cash  = byMethod('cash')
  const card  = byMethod('card')
  const upi   = byMethod('upi')
  // Anything that isn't one of the three primary methods (split/mixed,
  // net banking) is grouped here so it's still counted and visible instead
  // of silently vanishing from the payment-method breakdown. Pending credit
  // bills are excluded — they get their own Credit block, not "Other".
  const other = transactions.filter(t => !isPendingCredit(t) && !['cash', 'card', 'upi'].includes(t.method?.toLowerCase()))

  const pendingCredit    = transactions.filter(isPendingCredit)
  const pendingCreditAmt = sumAmt(pendingCredit)

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30)

  const dailyTx   = transactions.filter(t => isTodayIST(t.date))
  const weeklyTx  = transactions.filter(t => new Date(t.date) >= weekAgo)
  const monthlyTx = transactions.filter(t => new Date(t.date) >= monthAgo)

  const totalRevenue = sumAmt(transactions)

  const methodCards = [
    { label: 'Cash Sales',   icon: 'cash',         color: 'var(--green)', value: `₹${sumAmt(cash).toLocaleString()}`, sub: `${cash.length} transactions` },
    { label: 'Card Sales',   icon: 'credit-card',  color: 'var(--blue)',  value: `₹${sumAmt(card).toLocaleString()}`, sub: `${card.length} transactions` },
    { label: 'UPI Sales',    icon: 'qrcode',       color: 'var(--purple)',value: `₹${sumAmt(upi).toLocaleString()}`,  sub: `${upi.length} transactions`  },
    { label: 'Credit',       icon: 'notes',        color: 'var(--red)',   value: `₹${pendingCreditAmt.toLocaleString()}`, sub: `${pendingCredit.length} pending bill${pendingCredit.length !== 1 ? 's' : ''}` },
    { label: 'Other/Mixed',  icon: 'stack-2',      color: 'var(--amber)', value: `₹${sumAmt(other).toLocaleString()}`, sub: `${other.length} transactions` },
  ]

  const summaryCards = [
    { label: 'Daily Sales',   value: `₹${sumAmt(dailyTx).toLocaleString()}`,   sub: `${dailyTx.length} transactions`,   icon: 'sun',           color: 'var(--green)' },
    { label: 'Weekly Sales',  value: `₹${sumAmt(weeklyTx).toLocaleString()}`,  sub: `${weeklyTx.length} transactions`,  icon: 'calendar-week', color: 'var(--blue)'  },
    { label: 'Monthly Sales', value: `₹${sumAmt(monthlyTx).toLocaleString()}`, sub: `${monthlyTx.length} transactions`, icon: 'calendar',      color: 'var(--amber)' },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`,      sub: `${transactions.length} total`,     icon: 'trending-up',   color: 'var(--purple)'},
  ]

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const dayTx = transactions.filter(t => istDateKey(t.date) === istDateKey(d))
    return { label: d.toLocaleDateString('en-IN', { weekday: 'short' }), amount: sumAmt(dayTx) }
  })
  const maxBar = Math.max(...last7.map(d => d.amount), 1)

  return (
    <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Reports</div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {summaryCards.map(r => (
          <div key={r.label} style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <i className={`ti ti-${r.icon}`} style={{ fontSize: 20, color: r.color }}></i>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: r.color, marginBottom: 2 }}>{r.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{r.label}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{r.sub}</div>
          </div>
        ))}
      </div>

      <div className="payment-method-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {methodCards.map(m => (
          <div key={m.label} style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <i className={`ti ti-${m.icon}`} style={{ fontSize: 22, color: m.color }}></i>
              <div style={{ fontSize: 13, fontWeight: 600, color: m.color }}>{m.label}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Daily Sales – Last 7 Days</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
          {last7.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>₹{d.amount > 0 ? (d.amount/1000).toFixed(1)+'k' : '0'}</div>
              <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: d.amount > 0 ? 'var(--green)' : 'var(--bg3)', height: `${Math.max(4, (d.amount / maxBar) * 70)}px`, transition: 'height 0.3s' }}></div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Recent Transactions</div>
        {transactions.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No transactions yet.</div>
        ) : transactions.slice(0, 10).map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 12, fontFamily: "'DM Mono'", color: 'var(--green)' }}>{s.id}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.customer} · {new Date(s.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--text2)' }}>{s.method}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>₹{s.total}</span>
              <SaleBadge status={s.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Inventory ─── */
export function InventoryPage() {
  // Previously this page (like ProductsPage) managed products purely in
  // local/shared React state and never called the backend, so every change
  // here was invisible to the real system and vanished on refresh.
  const { products, refreshProducts, showToast } = useApp()
  const [categories, setCategories] = useState([])
  const [showAdd,  setShowAdd]  = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [form,     setForm]     = useState({ name: '', pack: '', price: '', stock: '', category_id: '', sku: '' })

  useEffect(() => {
    getCategories()
      .then(cats => {
        setCategories(cats)
        setForm(f => ({ ...f, category_id: f.category_id || String(cats[0]?.id ?? '') }))
      })
      .catch(err => console.error('Failed to load categories:', err))
  }, [])

  const low  = products.filter(p => p.stock <= 50 && p.stock > 20).length
  const crit = products.filter(p => p.stock <= 20).length

  function openAdd() {
    // Fix: previously defaulted to category: 'white', which doesn't exist
    // in the real category list, so new products silently got an
    // unmatched category. Default to the first real category instead.
    setForm({ name: '', pack: '', price: '', stock: '', category_id: String(categories[0]?.id ?? ''), sku: '' })
    setEditItem(null); setShowAdd(true)
  }

  function openEdit(p) {
    setForm({
      name: p.name, pack: p.pack, price: String(p.price), stock: String(p.stock),
      category_id: String(p.category_id ?? categories.find(c => c.slug === p.category)?.id ?? ''),
      sku: p.sku || '',
    })
    setEditItem(p); setShowAdd(true)
  }

  async function handleSave() {
    if (saving) return // already saving — ignore re-entrant calls (e.g. double-click)
    if (!form.name || !form.price) {
      showToast('Product name and price are required', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name:  form.name,
        pack:  form.pack || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        sku:   form.sku || null,
      }
      if (editItem) {
        await updateProduct(editItem.id, payload)
        showToast('Product updated')
      } else {
        await createProduct({ ...payload, emoji: '🥚' })
        showToast('Product added')
      }
      await refreshProducts()
      setShowAdd(false)
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(product) {
    try {
      await deleteProduct(product.id)
      showToast('Product deleted')
      await refreshProducts()
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error')
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <PageHeader title="Inventory" action={
        <div style={{ display: 'flex', gap: 10 }}>
          <AddButton label="Add New Product" onClick={openAdd} />
        </div>
      } />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          ['Total SKUs', products.length, 'ti-package', 'var(--blue)'],
          ['Low Stock',  low,             'ti-alert-triangle', 'var(--amber)'],
          ['Critical',   crit,            'ti-x',      'var(--red)'],
        ].map(([l, v, icon, c]) => (
          <div key={l} style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <i className={icon} style={{ fontSize: 20, color: c, display: 'block', marginBottom: 8 }}></i>
            <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHeader cols={['Product', 'Category', 'Pack', 'Price', 'Stock', 'Status', 'Actions']} />
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.emoji} {p.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{p.category_name ?? p.category}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>{p.pack}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>₹{p.price}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{p.stock}</td>
                <td style={{ padding: '12px 16px' }}><StatusBadge stock={p.stock} /></td>
                <td style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(p)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--blue)', cursor: 'pointer', fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
                    <i className="ti ti-edit" style={{ marginRight: 4 }}></i>Edit
                  </button>
                  <button onClick={() => setConfirmDelete(p)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--red)', cursor: 'pointer', fontSize: 12, padding: '4px 10px', borderRadius: 6 }}>
                    <i className="ti ti-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={showAdd} onClose={() => setShowAdd(false)} title={editItem ? 'Edit Product' : 'Add New Product'}>
        {[
          ['Product Name', 'name', 'text'],
          ['Pack Size', 'pack', 'text'],
          ['Price (₹)', 'price', 'number'],
          ['Stock Qty', 'stock', 'number'],
          ['SKU / Barcode (optional)', 'sku', 'text'],
        ].map(([label, key, type]) => (
          <FormField key={key} label={label}>
            <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
          </FormField>
        ))}
        <FormField label="Category">
          <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={inputStyle}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <ModalActions onCancel={() => setShowAdd(false)} onConfirm={handleSave} confirmLabel={saving ? 'Saving…' : (editItem ? 'Save Changes' : 'Add Product')} disabled={saving} />
      </Modal>

      {/* Delete confirmation — previously delete fired immediately on click
          with no "are you sure?" step. */}
      <Modal show={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Product?">
        {confirmDelete && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This can't be undone from here.
            </div>
            <ModalActions
              onCancel={() => setConfirmDelete(null)}
              onConfirm={() => handleDelete(confirmDelete)}
              confirmLabel="Delete"
              confirmColor="var(--red)"
            />
          </>
        )}
      </Modal>
    </div>
  )
}

/* ─── History ─── */

// Builds a genuine .xlsx workbook (not a renamed CSV) for the Billing
// History table, one row per bill. Mirrors the export pattern already used
// for Purchase History so both exports behave consistently.
function exportBillsToExcel(bills) {
  const header = ['Invoice', 'Date', 'Time', 'Customer', 'Items', 'Method', 'Total', 'Status']
  const rows = [header]

  for (const s of bills) {
    const dt = new Date(s.date)
    rows.push([
      s.id,
      dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      s.customer || '',
      s.items,
      s.method || '',
      Number(s.total) || 0,
      s.status || '',
    ])
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 18 },
    { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Billing History')
  XLSX.writeFile(workbook, `billing-history-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function HistoryPage() {
  const { transactions: localTx, token, role } = useApp()
  const [transactions, setTransactions] = useState(localTx)
  const [viewBill, setViewBill] = useState(null)     // bill currently shown in the Open Bill modal
  const [loadingBillId, setLoadingBillId] = useState(null)
  const [exporting, setExporting] = useState(false)

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
          customer: b.customer_name,
          status:   b.payment_status,
          items:    b.item_count ?? (b.items?.length ?? 0),
        })))
        else setTransactions(localTx)
      })
      .catch(() => setTransactions(localTx))
  }, [token])

  const all = transactions

  // Fetches the full bill (with line items) on demand so "Open Bill" shows
  // exactly what the customer bought, without loading every bill's items
  // upfront on a page that can list hundreds of rows.
  const handleOpenBill = useCallback(async (s) => {
    setLoadingBillId(s.id)
    try {
      const full = await getBill(s.id)
      setViewBill(full)
    } catch (err) {
      console.error('Failed to load bill:', err)
    } finally {
      setLoadingBillId(null)
    }
  }, [])

  const handleExport = useCallback(() => {
    if (!all.length) return
    setExporting(true)
    try {
      exportBillsToExcel(all)
    } finally {
      setExporting(false)
    }
  }, [all])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600 }}>Billing History</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--bg2)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 6 }}>
            {all.length} bill{all.length !== 1 ? 's' : ''} saved
          </span>
          <button
            onClick={handleExport}
            disabled={exporting || !all.length}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid var(--green)',
              background: 'transparent', color: 'var(--green)', fontSize: 12, fontWeight: 600,
              cursor: exporting || !all.length ? 'not-allowed' : 'pointer',
              opacity: exporting || !all.length ? 0.6 : 1,
            }}
          >
            {exporting ? 'Exporting…' : '⬇ Export to Excel'}
          </button>
        </div>
      </div>
      <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHeader cols={role === 'admin'
            ? ['Invoice', 'Date', 'Time', 'Customer', 'Items', 'Method', 'Total', 'Status', '']
            : ['Invoice', 'Date', 'Time', 'Customer', 'Items', 'Method', 'Total', 'Status']} />
          <tbody>
            {all.length === 0 ? (
              <tr><td colSpan={role === 'admin' ? 9 : 8} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                No billing history yet. Complete a sale to see it here.
              </td></tr>
            ) : all.map((s, i) => {
              const dt = new Date(s.date)
              return (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: "'DM Mono'", color: 'var(--green)' }}>{s.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>{dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>{dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{s.customer}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{s.items}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)', color: 'var(--text2)', fontSize: 11 }}>{s.method}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>₹{s.total}</td>
                  <td style={{ padding: '12px 16px' }}><SaleBadge status={s.status} /></td>
                  {role === 'admin' && (
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => handleOpenBill(s)}
                        disabled={loadingBillId === s.id}
                        style={{
                          padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                          background: 'var(--bg3)', color: 'var(--text)', fontSize: 11, fontWeight: 500,
                          cursor: loadingBillId === s.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
                        }}
                      >
                        {loadingBillId === s.id ? 'Loading…' : 'Open Bill'}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal show={!!viewBill} onClose={() => setViewBill(null)} title={viewBill ? `Invoice ${viewBill.invoice_number || viewBill.id}` : ''} width={480}>
        {viewBill && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
              <span>{new Date(viewBill.created_at).toLocaleString('en-IN')}</span>
              <span>{viewBill.customer_name || 'Walk-in customer'}</span>
            </div>
            <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <TableHeader cols={['Product', 'Qty', 'Price', 'Total']} />
                <tbody>
                  {(viewBill.items || []).map((it, idx) => (
                    <tr key={it.id ?? idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 12px', fontSize: 13 }}>{it.name}{it.pack ? ` (${it.pack})` : ''}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13 }}>{it.qty}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13 }}>₹{Number(it.price).toFixed(2)}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>₹{Number(it.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>Subtotal</span><span>₹{Number(viewBill.subtotal).toFixed(2)}</span></div>
              {Number(viewBill.discount_amt) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>Discount</span><span>-₹{Number(viewBill.discount_amt).toFixed(2)}</span></div>
              )}
              {Number(viewBill.tax_amt) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>Tax</span><span>₹{Number(viewBill.tax_amt).toFixed(2)}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 4 }}><span>Total</span><span>₹{Number(viewBill.total).toFixed(2)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ─── Credits (Admin only) ───────────────────────────────────────────────
   Lists outstanding credit bills and lets an admin settle them via Cash /
   UPI / Card. Settling updates the bill's payment_status to 'paid', frees
   up the customer's credit limit, and records the settlement so Sales
   History / Reports pick up the correct payment mode automatically. */
export function CreditsPage() {
  const { token, role, showToast } = useApp()
  const [bills, setBills]     = useState([])
  const [loading, setLoading] = useState(true)
  const [settleBill, setSettleBill] = useState(null)   // bill currently in the "Mark as Paid" modal
  const [settleMethod, setSettleMethod] = useState('cash')
  const [settling, setSettling] = useState(false)

  const loadPending = useCallback(() => {
    if (!token) return
    setLoading(true)
    getBills({ status: 'credit' })
      .then(rows => setBills(rows || []))
      .catch(() => showToast('Failed to load credit bills', 'error'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => { loadPending() }, [loadPending])

  const totalOutstanding = bills.reduce((s, b) => s + parseFloat(b.total), 0)

  async function confirmSettle() {
    if (!settleBill) return
    setSettling(true)
    try {
      await settleCreditBill(settleBill.id, settleMethod)
      setBills(prev => prev.filter(b => b.id !== settleBill.id))
      showToast(`Bill ${settleBill.invoice_number} marked as paid (${settleMethod.toUpperCase()})`)
      setSettleBill(null)
      setSettleMethod('cash')
    } catch (err) {
      showToast(err.message || 'Failed to settle credit bill', 'error')
    } finally {
      setSettling(false)
    }
  }

  // Admin-only page — cashiers should never see or reach this even via
  // direct navigation state.
  if (role !== 'admin') {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
        You don't have access to this page.
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Credits</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Outstanding credit bills awaiting payment</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--bg2)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 8 }}>
          <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 14 }}>₹{totalOutstanding.toLocaleString()}</span> outstanding · {bills.length} pending
        </div>
      </div>

      <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHeader cols={['Bill Number', 'Customer', 'Date & Time', 'Total Amount', 'Outstanding', 'Status', '']} />
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Loading…</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>No outstanding credit bills. 🎉</td></tr>
            ) : bills.map(b => {
              const dt = new Date(b.created_at)
              return (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 12, fontFamily: "'DM Mono'", color: 'var(--green)' }}>{b.invoice_number}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.customer_name || 'Walk-in Customer'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>
                    {dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>₹{Number(b.total).toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>₹{Number(b.total).toFixed(2)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: '#2a1500', color: 'var(--amber)' }}>Pending</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => { setSettleBill(b); setSettleMethod('cash') }}
                      style={{
                        padding: '6px 12px', borderRadius: 6, border: '1px solid var(--green)',
                        background: 'transparent', color: 'var(--green)', fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Mark as Paid
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal show={!!settleBill} onClose={() => !settling && setSettleBill(null)} title="Mark Credit Bill as Paid" width={400}>
        {settleBill && (
          <div>
            <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                <span>Bill</span><span style={{ color: 'var(--text)' }}>{settleBill.invoice_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                <span>Customer</span><span style={{ color: 'var(--text)' }}>{settleBill.customer_name || 'Walk-in Customer'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: 'var(--green)', marginTop: 6 }}>
                <span>Amount Due</span><span>₹{Number(settleBill.total).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Received Via</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[['Cash', 'cash', 'cash'], ['Card', 'card', 'credit-card'], ['UPI', 'upi', 'qrcode']].map(([label, val, icon]) => (
                <button key={val} onClick={() => setSettleMethod(val)} style={{
                  padding: '12px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  border: `1.5px solid ${settleMethod === val ? 'var(--green)' : 'var(--border)'}`,
                  background: settleMethod === val ? 'var(--green-dim)' : 'var(--bg2)',
                  color: settleMethod === val ? 'var(--green)' : 'var(--text)',
                }}>
                  <i className={`ti ti-${icon}`} style={{ display: 'block', fontSize: 20, marginBottom: 4 }}></i>{label}
                </button>
              ))}
            </div>

            <ModalActions
              onCancel={() => setSettleBill(null)}
              onConfirm={confirmSettle}
              confirmLabel={settling ? 'Saving…' : `Confirm ${settleMethod.toUpperCase()} Payment`}
              disabled={settling}
            />
          </div>
        )}
      </Modal>
    </div>
  )
}


export function SettingsPage() {
  const { theme, setTheme, productView, setProductView, tax, setTax } = useApp()
  const [storeName, setStoreName] = useState('RBR Egg Mart')
  const [phone,     setPhone]     = useState('')
  const [footer,    setFooter]    = useState('Thank you for shopping at RBR Egg Mart!')
  const [saved,     setSaved]     = useState(false)

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const fieldStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 13, outline: 'none' }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Settings</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--green)' }}>Store Settings</div>
          {[['Store Name', storeName, setStoreName], ['Contact', phone, setPhone], ['Receipt Footer', footer, setFooter]].map(([label, val, setter]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
              <input value={val} onChange={e => setter(e.target.value)} style={fieldStyle} />
            </div>
          ))}
          <button onClick={save} style={{ padding: '8px 16px', borderRadius: 8, background: saved ? 'var(--blue)' : 'var(--green)', color: '#0a1a0a', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--blue)' }}>Appearance</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Theme</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['dark', 'ti-moon', 'Dark Mode'], ['light', 'ti-sun', 'Light Mode']].map(([val, icon, label]) => (
                  <button key={val} onClick={() => setTheme(val)} style={{
                    padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    border: `1.5px solid ${theme === val ? 'var(--green)' : 'var(--border)'}`,
                    background: theme === val ? 'var(--green-dim)' : 'var(--bg3)',
                    color: theme === val ? 'var(--green)' : 'var(--text2)',
                  }}>
                    <i className={`ti ${icon}`} style={{ marginRight: 6 }}></i>{label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Product Display</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[['grid', 'ti-layout-grid', 'Grid View'], ['list', 'ti-list', 'List View']].map(([val, icon, label]) => (
                  <button key={val} onClick={() => setProductView(val)} style={{
                    padding: '10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                    border: `1.5px solid ${productView === val ? 'var(--green)' : 'var(--border)'}`,
                    background: productView === val ? 'var(--green-dim)' : 'var(--bg3)',
                    color: productView === val ? 'var(--green)' : 'var(--text2)',
                  }}>
                    <i className={`ti ${icon}`} style={{ marginRight: 6 }}></i>{label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--amber)' }}>POS Settings</div>

            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                <span>Tax Rate</span>
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>{tax}%</span>
              </div>
              <input type="range" min="0" max="30" step="0.5" value={tax}
                onChange={e => setTax(parseFloat(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                <span>0%</span><span>15%</span><span>30%</span>
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)', background: 'var(--bg3)', borderRadius: 6, padding: '8px 10px' }}>
              <div><i className="ti ti-info-circle" style={{ marginRight: 4 }}></i>Default Customer: <strong style={{ color: 'var(--text)' }}>Walk-in Customer</strong></div>
              <div style={{ marginTop: 4 }}>Session Opening Amount: <strong style={{ color: 'var(--text)' }}>₹0 (default)</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Session End ─── */

const DENOMINATIONS = [
  { value: 500, label: '₹500', color: 'var(--green)',  dimColor: 'var(--green-dim)',  icon: 'notes' },
  { value: 200, label: '₹200', color: 'var(--blue)',   dimColor: '#0a1428',           icon: 'notes' },
  { value: 100, label: '₹100', color: 'var(--amber)',  dimColor: '#2a1f0a',           icon: 'notes' },
  { value: 50,  label: '₹50',  color: 'var(--purple)', dimColor: '#1a0f28',           icon: 'coin'  },
]

export function SessionEndPage() {
  const { session, transactions, closeSession, setActive, logout } = useApp()

  // ── Step state: 'summary' → 'drawer' → 'done' ──
  const [step, setStep] = useState('summary')

  // Denomination counts entered by cashier
  const [counts, setCounts] = useState({ 500: '', 200: '', 100: '', 50: '' })

  const s = session
  const startTime  = s ? new Date(s.opened_at || s.date) : new Date()
  const now        = new Date()
  const durationMs = now - startTime
  const hours      = Math.floor(durationMs / 3600000)
  const minutes    = Math.floor((durationMs % 3600000) / 60000)

  const sessionTx = s
    ? transactions.filter(t => new Date(t.date) >= startTime)
    : []

  const cashTotal  = sessionTx.filter(t => t.method?.toLowerCase() === 'cash').reduce((sum, t) => sum + t.total, 0)
  const upiTotal   = sessionTx.filter(t => t.method?.toLowerCase() === 'upi').reduce((sum, t)  => sum + t.total, 0)
  const cardTotal  = sessionTx.filter(t => t.method?.toLowerCase() === 'card').reduce((sum, t) => sum + t.total, 0)
  const totalSales = cashTotal + upiTotal + cardTotal

  const cashCount = sessionTx.filter(t => t.method?.toLowerCase() === 'cash').length
  const upiCount  = sessionTx.filter(t => t.method?.toLowerCase() === 'upi').length
  const cardCount = sessionTx.filter(t => t.method?.toLowerCase() === 'card').length

  const openingCash = s ? parseFloat(s.opening_cash || 0) : 0
  const closingCash = openingCash + cashTotal

  // Drawer calculation
  const drawerTotal = DENOMINATIONS.reduce((sum, d) => {
    const qty = parseInt(counts[d.value]) || 0
    return sum + qty * d.value
  }, 0)

  const hasAnyCount = DENOMINATIONS.some(d => counts[d.value] !== '')
  const diff = drawerTotal - closingCash
  const diffAbs = Math.abs(diff)
  const diffLabel = diff === 0 ? 'Balanced' : diff > 0 ? `+₹${diffAbs.toLocaleString()} Over` : `-₹${diffAbs.toLocaleString()} Short`
  const diffColor = diff === 0 ? 'var(--green)' : diff > 0 ? 'var(--amber)' : 'var(--red)'

  function handleCount(denom, val) {
    // Only allow non-negative integers
    if (val === '' || /^\d+$/.test(val)) {
      setCounts(prev => ({ ...prev, [denom]: val }))
    }
  }

  async function handleClose() {
    const drawerCountsToSave = {
      500: parseInt(counts[500]) || 0,
      200: parseInt(counts[200]) || 0,
      100: parseInt(counts[100]) || 0,
       50: parseInt(counts[50])  || 0,
    }
    await closeSession(drawerCountsToSave)
    // The button is labeled "Close & Logout" — actually log out (clear the
    // persisted token) before reloading, otherwise the reload restores the
    // cashier's session and lands back on the Open Session page instead of
    // the login page.
    logout()
    window.location.reload()
  }

  const inpStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg3)',
    color: 'var(--text)',
    fontSize: 16,
    fontWeight: 700,
    outline: 'none',
    textAlign: 'center',
    letterSpacing: '0.5px',
  }

  // ── STEP: Summary ──────────────────────────────────────────────────────────
  if (step === 'summary') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: 'var(--bg0)' }}>
        <div style={{ width: '100%', maxWidth: 520 }}>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 60, height: 60, borderRadius: 50, background: 'var(--amber-dim, #2a1f0a)', border: '1px solid var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 26 }}>
              🏁
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>End of Session Summary</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              {startTime.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })} &nbsp;·&nbsp;
              {startTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              &nbsp;({hours}h {minutes}m)
            </div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Amount Collected by Method
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Cash',  icon: 'cash',        color: 'var(--green)',  dimColor: 'var(--green-dim)',  total: cashTotal,  count: cashCount },
              { label: 'UPI',   icon: 'qrcode',      color: 'var(--blue)',   dimColor: '#0a1428',           total: upiTotal,   count: upiCount  },
              { label: 'Card',  icon: 'credit-card', color: 'var(--amber)',  dimColor: '#2a1f0a',           total: cardTotal,  count: cardCount },
            ].map(m => (
              <div key={m.label} style={{
                background: m.dimColor,
                border: `1px solid ${m.color}`,
                borderRadius: 12, padding: '14px 12px', textAlign: 'center',
              }}>
                <i className={`ti ti-${m.icon}`} style={{ fontSize: 22, color: m.color, display: 'block', marginBottom: 8 }}></i>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>₹{m.total.toLocaleString()}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{m.count} bill{m.count !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
            {[
              ['Opening Cash',    `₹${openingCash.toLocaleString()}`,   'var(--blue)'],
              ['Cash Collected',  `₹${cashTotal.toLocaleString()}`,     'var(--green)'],
              ['Closing Cash',    `₹${closingCash.toLocaleString()}`,   'var(--amber)'],
              ['Total Sales',     `₹${totalSales.toLocaleString()}`,    'var(--green)'],
              ['Total Bills',     sessionTx.length,                     'var(--text)'],
            ].map(([label, value, color]) => (
              <div key={label} style={{
                background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)',
                padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => setActive('billing')} style={{
              padding: '13px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: 'var(--text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>
              <i className="ti ti-arrow-left" style={{ marginRight: 6 }}></i>Back to Billing
            </button>
            <button onClick={() => setStep('drawer')} style={{
              padding: '13px', borderRadius: 10,
              border: '1px solid var(--amber)', background: '#2a1f0a',
              color: 'var(--amber)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              <i className="ti ti-building-bank" style={{ marginRight: 6 }}></i>Count Drawer →
            </button>
          </div>

          <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 16 }}>
            Count the cash drawer before closing the session.
          </div>
        </div>
      </div>
    )
  }

  // ── STEP: Drawer Count ─────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', background: 'var(--bg0)' }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 50, background: '#1a1400', border: '1px solid var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 24 }}>
            🏦
          </div>
          <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Cash Drawer Count</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            Enter the number of notes/coins for each denomination
          </div>
        </div>

        {/* Expected closing cash reference */}
        <div style={{
          background: '#0a1428', border: '1px solid var(--blue)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            <i className="ti ti-info-circle" style={{ marginRight: 6, color: 'var(--blue)' }}></i>
            Expected Closing Cash
          </span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--blue)' }}>
            ₹{closingCash.toLocaleString()}
          </span>
        </div>

        {/* Denomination Rows */}
        <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
          {DENOMINATIONS.map(d => {
            const qty = parseInt(counts[d.value]) || 0
            const subtotal = qty * d.value
            return (
              <div key={d.value} style={{
                background: 'var(--bg2)',
                border: `1px solid ${counts[d.value] !== '' ? d.color : 'var(--border)'}`,
                borderRadius: 12,
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: '72px 1fr auto',
                alignItems: 'center',
                gap: 14,
                transition: 'border-color 0.2s',
              }}>
                {/* Denomination badge */}
                <div style={{
                  background: d.dimColor,
                  border: `1px solid ${d.color}`,
                  borderRadius: 8,
                  padding: '8px 0',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: d.color }}>{d.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>note</div>
                </div>

                {/* Count input */}
                <div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5 }}>Quantity in drawer</div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={counts[d.value]}
                    onChange={e => handleCount(d.value, e.target.value)}
                    style={inpStyle}
                  />
                </div>

                {/* Subtotal */}
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5 }}>Subtotal</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: qty > 0 ? d.color : 'var(--muted)' }}>
                    ₹{subtotal.toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total Summary */}
        <div style={{
          background: 'var(--bg2)',
          border: `2px solid ${hasAnyCount ? diffColor : 'var(--border)'}`,
          borderRadius: 12,
          padding: '16px 18px',
          marginBottom: 20,
          transition: 'border-color 0.3s',
        }}>
          {/* Per-denomination breakdown */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
              Breakdown
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {DENOMINATIONS.map(d => {
                const qty = parseInt(counts[d.value]) || 0
                return (
                  <div key={d.value} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: d.color,
                        background: d.dimColor, border: `1px solid ${d.color}`,
                        borderRadius: 4, padding: '1px 6px',
                      }}>{d.label}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>× {qty}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: qty > 0 ? 'var(--text)' : 'var(--muted)' }}>
                      ₹{(qty * d.value).toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Total Counted</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: hasAnyCount ? 'var(--text)' : 'var(--muted)' }}>
                ₹{drawerTotal.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Expected Closing</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--blue)' }}>
                ₹{closingCash.toLocaleString()}
              </span>
            </div>
            {hasAnyCount && (
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: diff === 0 ? 'var(--green-dim)' : diff > 0 ? '#2a1f0a' : '#1a0808',
                border: `1px solid ${diffColor}`,
                borderRadius: 8, padding: '9px 12px', marginTop: 4,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: diffColor }}>
                  {diff === 0 ? (
                    <><i className="ti ti-circle-check" style={{ marginRight: 6 }}></i>Drawer Balanced</>
                  ) : diff > 0 ? (
                    <><i className="ti ti-arrow-up" style={{ marginRight: 6 }}></i>Over by</>
                  ) : (
                    <><i className="ti ti-arrow-down" style={{ marginRight: 6 }}></i>Short by</>
                  )}
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: diffColor }}>
                  {diff === 0 ? '✓' : `₹${diffAbs.toLocaleString()}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => setStep('summary')} style={{
            padding: '13px', borderRadius: 10,
            border: '1px solid var(--border)', background: 'var(--bg2)',
            color: 'var(--text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>
            <i className="ti ti-arrow-left" style={{ marginRight: 6 }}></i>Back
          </button>
          <button onClick={handleClose} style={{
            padding: '13px', borderRadius: 10,
            border: '1px solid var(--red)', background: '#1a0808',
            color: 'var(--red)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            <i className="ti ti-logout" style={{ marginRight: 6 }}></i>Close & Logout
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', marginTop: 16 }}>
          Closing this session will log you out and archive all transaction data.
        </div>
      </div>
    </div>
  )
}
