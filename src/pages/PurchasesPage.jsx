import { useState, useRef, useEffect } from 'react'
import { useApp } from '../App'
import { PageHeader, AddButton, TableHeader, Modal, FormField, inputStyle, ModalActions } from '../components/UI'

const EMPTY_ITEM = { name: '', amount: '' }
const EMPTY_FORM = { shopName: '', items: [{ ...EMPTY_ITEM }], paymentStatus: 'paid' }

// ── Product Autocomplete Input (Issue #2 + #3) ───────────────────────────────
function ProductAutocomplete({ value, onChange, products, onAddProduct, error }) {
  const [query,   setQuery]   = useState(value || '')
  const [open,    setOpen]    = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapRef = useRef(null)

  // Sync external value changes (e.g. clearing form)
  useEffect(() => { setQuery(value || '') }, [value])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = query.trim().length === 0
    ? products.slice(0, 8)
    : products.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)

  function select(name) {
    setQuery(name)
    onChange(name)
    setOpen(false)
  }

  function handleInput(e) {
    const v = e.target.value
    setQuery(v)
    onChange(v)
    setOpen(true)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={handleInput}
        onFocus={() => { setFocused(true); setOpen(true) }}
        onBlur={() => setFocused(false)}
        placeholder="Search or type item name..."
        style={{
          ...inputStyle,
          borderColor: error ? 'var(--red)' : focused ? 'var(--green)' : undefined,
          paddingRight: 32,
        }}
        autoComplete="off"
      />
      {/* Chevron */}
      <i
        className={`ti ti-chevron-${open ? 'up' : 'down'}`}
        onClick={() => setOpen(v => !v)}
        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}
      />

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg1)', border: '1px solid var(--border)',
          borderRadius: 10, zIndex: 9999,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          maxHeight: 220, overflowY: 'auto',
        }}>
          {/* Existing products */}
          {filtered.length === 0 && query.trim() ? (
            <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--muted)' }}>
              No match — you can type a custom name or add a new product below.
            </div>
          ) : filtered.map(p => (
            <button key={p.id} onMouseDown={() => select(p.name)} style={{
              width: '100%', textAlign: 'left', background: 'none', border: 'none',
              padding: '9px 14px', cursor: 'pointer', fontSize: 13,
              color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: 16 }}>{p.emoji || '🥚'}</span>
              <span style={{ flex: 1 }}>{p.name}</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.pack}</span>
            </button>
          ))}

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '2px 0' }} />

          {/* + Add Product option (Issue #3) */}
          <button
            onMouseDown={e => { e.preventDefault(); setOpen(false); onAddProduct() }}
            style={{
              width: '100%', textAlign: 'left', background: 'none', border: 'none',
              padding: '10px 14px', cursor: 'pointer', fontSize: 13,
              color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8,
              fontWeight: 600,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--green-dim)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <i className="ti ti-plus" style={{ fontSize: 15 }}></i>
            + Add Product
          </button>
        </div>
      )}
    </div>
  )
}

// ── Quick Add Product Modal (Issue #3) ───────────────────────────────────────
function QuickAddProductModal({ show, onClose, onSave, token }) {
  const [form, setForm] = useState({ name: '', pack: '', price: '', stock: '', emoji: '🥚' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (show) { setForm({ name: '', pack: '', price: '', stock: '', emoji: '🥚' }); setErr('') }
  }, [show])

  async function handleSave() {
    if (!form.name.trim()) { setErr('Product name is required'); return }
    if (!form.price || isNaN(parseFloat(form.price))) { setErr('Valid price is required'); return }
    setSaving(true)
    setErr('')
    try {
      // Try to save to backend if token available
      if (token) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            name:  form.name.trim(),
            pack:  form.pack.trim() || null,
            price: parseFloat(form.price),
            stock: parseInt(form.stock) || 0,
            emoji: form.emoji || '🥚',
          }),
        })
        if (res.ok) {
          const newProduct = await res.json()
          onSave({ ...newProduct, category: newProduct.category_slug || 'white', emoji: newProduct.emoji || '🥚' })
          onClose()
          setSaving(false)
          return
        }
      }
      // Offline fallback — add locally
      onSave({
        id:       Date.now(),
        name:     form.name.trim(),
        pack:     form.pack.trim() || '',
        price:    parseFloat(form.price),
        stock:    parseInt(form.stock) || 0,
        emoji:    form.emoji || '🥚',
        category: 'white',
      })
      onClose()
    } catch {
      setErr('Failed to save product. Added locally.')
      onSave({
        id: Date.now(), name: form.name.trim(), pack: form.pack.trim() || '',
        price: parseFloat(form.price) || 0, stock: parseInt(form.stock) || 0,
        emoji: '🥚', category: 'white',
      })
      onClose()
    }
    setSaving(false)
  }

  const EMOJIS = ['🥚','🐣','🐔','📦','🛒','🧺']

  return (
    <Modal show={show} onClose={onClose} title="Quick Add Product" width={400}>
      {err && (
        <div style={{ background: '#1a0808', border: '1px solid var(--red)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>
          {err}
        </div>
      )}

      {/* Emoji picker */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Emoji</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} style={{
              fontSize: 20, background: form.emoji === e ? 'var(--green-dim)' : 'var(--bg3)',
              border: `1px solid ${form.emoji === e ? 'var(--green)' : 'var(--border)'}`,
              borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
            }}>{e}</button>
          ))}
        </div>
      </div>

      <FormField label="Product Name *">
        <input
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. White Eggs (30 pcs)"
          style={inputStyle}
          autoFocus
        />
      </FormField>
      <FormField label="Pack Size">
        <input
          value={form.pack}
          onChange={e => setForm(f => ({ ...f, pack: e.target.value }))}
          placeholder="e.g. 30 pcs / tray"
          style={inputStyle}
        />
      </FormField>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <FormField label="Price (₹) *">
          <input
            type="number" min="0"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            placeholder="0.00"
            style={inputStyle}
          />
        </FormField>
        <FormField label="Stock Qty">
          <input
            type="number" min="0"
            value={form.stock}
            onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
            placeholder="0"
            style={inputStyle}
          />
        </FormField>
      </div>
      <ModalActions
        onCancel={onClose}
        onConfirm={handleSave}
        confirmLabel={saving ? 'Saving…' : 'Add Product'}
      />
    </Modal>
  )
}

// ── Main PurchasesPage ────────────────────────────────────────────────────────
export default function PurchasesPage() {
  const { purchases, addPurchase, updatePurchase, products, setProducts, token } = useApp()
  const [showModal,       setShowModal]       = useState(false)
  const [editId,          setEditId]          = useState(null)
  const [form,            setForm]            = useState(EMPTY_FORM)
  const [errors,          setErrors]          = useState({})
  const [filter,          setFilter]          = useState('all')
  const [showAddProduct,  setShowAddProduct]  = useState(false)
  const [addProductForIdx, setAddProductForIdx] = useState(null)  // which item row triggered it

  // ─── Form helpers ──────────────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setErrors({})
    setShowModal(true)
  }

  function openEdit(p) {
    setForm({ shopName: p.shopName, items: p.items.map(i => ({ ...i })), paymentStatus: p.paymentStatus })
    setEditId(p.id)
    setErrors({})
    setShowModal(true)
  }

  function setItem(idx, field, value) {
    setForm(f => {
      const items = [...f.items]
      items[idx] = { ...items[idx], [field]: value }
      return { ...f, items }
    })
  }

  function addItem() {
    setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))
  }

  function removeItem(idx) {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))
  }

  function validate() {
    const e = {}
    if (!form.shopName.trim()) e.shopName = 'Shop name is required'
    if (form.items.length === 0) e.items = 'Add at least one item'
    form.items.forEach((item, i) => {
      if (!item.name.trim())    e[`item_name_${i}`]   = 'Item name required'
      if (!item.amount || isNaN(parseFloat(item.amount)) || parseFloat(item.amount) < 0)
                                e[`item_amount_${i}`] = 'Valid amount required'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const payload = {
      shopName:      form.shopName.trim(),
      items:         form.items.map(i => ({ name: i.name.trim(), amount: parseFloat(i.amount) })),
      paymentStatus: form.paymentStatus,
    }
    if (editId) updatePurchase(editId, payload)
    else        addPurchase(payload)
    setShowModal(false)
  }

  // When user picks "+ Add Product" from the dropdown
  function handleOpenAddProduct(itemIdx) {
    setAddProductForIdx(itemIdx)
    setShowAddProduct(true)
  }

  // After new product is created → add to global products list + auto-fill the field
  function handleProductCreated(newProduct) {
    setProducts(prev => [...prev, newProduct])
    if (addProductForIdx !== null) {
      setItem(addProductForIdx, 'name', newProduct.name)
    }
    setAddProductForIdx(null)
  }

  // ─── Computed ───────────────────────────────────────────────────────────────
  const totalAmount = (p) => p.items.reduce((s, i) => s + i.amount, 0)

  const filtered = purchases.filter(p =>
    filter === 'all' ? true : p.paymentStatus === filter
  )

  const stats = {
    total:   purchases.length,
    paid:    purchases.filter(p => p.paymentStatus === 'paid').length,
    overdue: purchases.filter(p => p.paymentStatus === 'overdue').length,
    spend:   purchases.reduce((s, p) => s + totalAmount(p), 0),
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <PageHeader
        title="Purchases"
        subtitle="Track all supplier purchases and payment status"
        action={<AddButton label="Add Purchase" onClick={openAdd} />}
      />

      {/* Stats */}
      <div className="purchases-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Purchases', value: stats.total,                        icon: 'shopping-cart', color: 'var(--blue)'   },
          { label: 'Paid',            value: stats.paid,                         icon: 'circle-check',  color: 'var(--green)'  },
          { label: 'Overdue',         value: stats.overdue,                      icon: 'alert-circle',  color: 'var(--red)'    },
          { label: 'Total Spend',     value: `₹${stats.spend.toLocaleString()}`, icon: 'wallet',        color: 'var(--amber)'  },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <i className={`ti ti-${s.icon}`} style={{ fontSize: 20, color: s.color, display: 'block', marginBottom: 8 }}></i>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all', 'All'], ['paid', 'Paid'], ['overdue', 'Overdue']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontWeight: 500,
            background: filter === val ? 'var(--green-dim)' : 'var(--bg2)',
            color:      filter === val ? 'var(--green)'     : 'var(--text2)',
            border: `1px solid ${filter === val ? 'var(--green)' : 'var(--border)'}`,
          }}>{label}</button>
        ))}
      </div>

      {/* Table */}
      <div className="table-scroll-wrapper" style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <TableHeader cols={['Shop Name', 'Items Purchased', 'Total Amount', 'Payment Status', 'Date', 'Actions']} />
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                  <i className="ti ti-shopping-cart" style={{ fontSize: 32, display: 'block', marginBottom: 8, opacity: 0.3 }}></i>
                  No purchases yet. Click "Add Purchase" to get started.
                </td>
              </tr>
            ) : filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{p.shopName}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)', maxWidth: 220 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {p.items.map((item, i) => (
                      <span key={i} style={{ background: 'var(--bg3)', borderRadius: 4, padding: '2px 7px', fontSize: 11 }}>
                        {item.name} <span style={{ color: 'var(--green)' }}>₹{item.amount}</span>
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700 }}>₹{totalAmount(p).toLocaleString()}</td>
                <td style={{ padding: '12px 16px' }}><PayStatusBadge status={p.paymentStatus} /></td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>
                  {new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => openEdit(p)} style={{
                    background: 'none', border: '1px solid var(--border)', color: 'var(--blue)',
                    cursor: 'pointer', fontSize: 12, padding: '4px 10px', borderRadius: 6,
                  }}>
                    <i className="ti ti-edit" style={{ marginRight: 4 }}></i>Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Purchase Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Purchase' : 'Add Purchase'} width={500}>
        {/* Shop Name */}
        <FormField label="Shop Name *">
          <input
            value={form.shopName}
            onChange={e => setForm({ ...form, shopName: e.target.value })}
            placeholder="e.g. Fresh Farm Co."
            style={{ ...inputStyle, borderColor: errors.shopName ? 'var(--red)' : undefined }}
          />
          {errors.shopName && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.shopName}</div>}
        </FormField>

        {/* Items with product autocomplete */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Items Purchased *</span>
            <button onClick={addItem} style={{ fontSize: 11, color: 'var(--green)', background: 'none', border: '1px solid var(--green)', borderRadius: 5, padding: '2px 8px', cursor: 'pointer' }}>
              + Add Row
            </button>
          </div>
          {errors.items && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6 }}>{errors.items}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 2 }}>
                  <ProductAutocomplete
                    value={item.name}
                    onChange={val => setItem(i, 'name', val)}
                    products={products}
                    onAddProduct={() => handleOpenAddProduct(i)}
                    error={errors[`item_name_${i}`]}
                  />
                  {errors[`item_name_${i}`] && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 2 }}>{errors[`item_name_${i}`]}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="number" min="0"
                    value={item.amount}
                    onChange={e => setItem(i, 'amount', e.target.value)}
                    placeholder="₹ Amount"
                    style={{ ...inputStyle, borderColor: errors[`item_amount_${i}`] ? 'var(--red)' : undefined }}
                  />
                  {errors[`item_amount_${i}`] && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 2 }}>Required</div>}
                </div>
                {form.items.length > 1 && (
                  <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18, paddingTop: 6 }}>
                    <i className="ti ti-x"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
          {form.items.some(i => i.amount) && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--green)', textAlign: 'right', fontWeight: 600 }}>
              Total: ₹{form.items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0).toLocaleString()}
            </div>
          )}
        </div>

        {/* Payment Status */}
        <FormField label="Payment Status">
          <select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })} style={inputStyle}>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </FormField>

        <ModalActions onCancel={() => setShowModal(false)} onConfirm={handleSave} confirmLabel={editId ? 'Save Changes' : 'Save Purchase'} />
      </Modal>

      {/* Quick Add Product Modal */}
      <QuickAddProductModal
        show={showAddProduct}
        onClose={() => { setShowAddProduct(false); setShowModal(true) }}
        onSave={handleProductCreated}
        token={token}
      />
    </div>
  )
}

function PayStatusBadge({ status }) {
  const isPaid = status === 'paid'
  return (
    <span style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 4, fontWeight: 600,
      background: isPaid ? 'var(--green-dim)' : '#1a0a0a',
      color:      isPaid ? 'var(--green-text)' : 'var(--red)',
    }}>
      {isPaid ? '✓ Paid' : '⚠ Overdue'}
    </span>
  )
}
