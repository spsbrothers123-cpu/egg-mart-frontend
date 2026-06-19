import { useState } from 'react'
import { useApp } from '../App'
import { PageHeader, AddButton, TableHeader, Modal, FormField, inputStyle, ModalActions } from '../components/UI'

const EMPTY_ITEM = { name: '', amount: '' }
const EMPTY_FORM = { shopName: '', items: [{ ...EMPTY_ITEM }], paymentStatus: 'paid' }

export default function PurchasesPage() {
  const { purchases, addPurchase, updatePurchase, showToast } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [errors,    setErrors]    = useState({})
  const [filter,    setFilter]    = useState('all')  // all | paid | overdue

  // ─── Form helpers ───────────────────────────────────────────────────────
  function openAdd() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setErrors({})
    setShowModal(true)
  }

  function openEdit(p) {
    setForm({
      shopName:      p.shopName,
      items:         p.items.map(i => ({ ...i })),
      paymentStatus: p.paymentStatus,
    })
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
    if (!form.shopName.trim())                         e.shopName = 'Shop name is required'
    if (form.items.length === 0)                        e.items = 'Add at least one item'
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
    if (editId) {
      updatePurchase(editId, payload)
    } else {
      addPurchase(payload)
    }
    setShowModal(false)
  }

  // ─── Computed ───────────────────────────────────────────────────────────
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

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <PageHeader
        title="Purchases"
        subtitle="Track all supplier purchases and payment status"
        action={<AddButton label="Add Purchase" onClick={openAdd} />}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Purchases', value: stats.total,                             icon: 'shopping-cart', color: 'var(--blue)'   },
          { label: 'Paid',            value: stats.paid,                              icon: 'circle-check',  color: 'var(--green)'  },
          { label: 'Overdue',         value: stats.overdue,                           icon: 'alert-circle',  color: 'var(--red)'    },
          { label: 'Total Spend',     value: `₹${stats.spend.toLocaleString()}`,      icon: 'wallet',        color: 'var(--amber)'  },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', padding: 16 }}>
            <i className={`ti ti-${s.icon}`} style={{ fontSize: 20, color: s.color, display: 'block', marginBottom: 8 }}></i>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
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
      <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                <td style={{ padding: '12px 16px' }}>
                  <PayStatusBadge status={p.paymentStatus} />
                </td>
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

      {/* Add / Edit Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Purchase' : 'Add Purchase'} width={480}>
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

        {/* Items */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Items Purchased *</span>
            <button onClick={addItem} style={{ fontSize: 11, color: 'var(--green)', background: 'none', border: '1px solid var(--green)', borderRadius: 5, padding: '2px 8px', cursor: 'pointer' }}>
              + Add Item
            </button>
          </div>
          {errors.items && <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 6 }}>{errors.items}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {form.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 2 }}>
                  <input
                    value={item.name}
                    onChange={e => setItem(i, 'name', e.target.value)}
                    placeholder="Item name"
                    style={{ ...inputStyle, borderColor: errors[`item_name_${i}`] ? 'var(--red)' : undefined }}
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
          {/* Total preview */}
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
