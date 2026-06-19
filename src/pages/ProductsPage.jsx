import { useState } from 'react'
import { PRODUCTS, CATEGORIES } from '../data'
import { PageHeader, AddButton, TableHeader, StatusBadge, Modal, FormField, inputStyle, ModalActions } from '../components/UI'

export default function ProductsPage() {
  const [products, setProducts] = useState(PRODUCTS)
  const [showAdd,  setShowAdd]  = useState(false)
  const [form,     setForm]     = useState({ name: '', pack: '', price: '', stock: '', category: 'white' })

  function handleAdd() {
    if (!form.name || !form.price) return
    setProducts(prev => [...prev, {
      id: Date.now(), name: form.name, pack: form.pack,
      price: parseFloat(form.price), stock: parseInt(form.stock) || 0,
      category: form.category, emoji: '🥚',
    }])
    setForm({ name: '', pack: '', price: '', stock: '', category: 'white' })
    setShowAdd(false)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
      <PageHeader
        title="Products"
        action={<AddButton label="Add Product" onClick={() => setShowAdd(true)} />}
      />

      <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <TableHeader cols={['Product', 'Category', 'Pack', 'Price', 'Stock', 'Status', 'Actions']} />
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.emoji} {p.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{p.category}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>{p.pack}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>₹{p.price}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.stock}</td>
                <td style={{ padding: '12px 16px' }}><StatusBadge stock={p.stock} /></td>
                <td style={{ padding: '12px 16px' }}>
                  <button style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', marginRight: 8, fontSize: 14 }}><i className="ti ti-edit"></i></button>
                  <button onClick={() => setProducts(prev => prev.filter(x => x.id !== p.id))} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14 }}><i className="ti ti-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal show={showAdd} onClose={() => setShowAdd(false)} title="Add Product">
        {[['Product Name', 'name', 'text'], ['Pack Size', 'pack', 'text'], ['Price (₹)', 'price', 'number'], ['Stock Qty', 'stock', 'number']].map(([label, key, type]) => (
          <FormField key={key} label={label}>
            <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
          </FormField>
        ))}
        <FormField label="Category">
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
            {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </FormField>
        <ModalActions onCancel={() => setShowAdd(false)} onConfirm={handleAdd} confirmLabel="Add Product" />
      </Modal>
    </div>
  )
}
