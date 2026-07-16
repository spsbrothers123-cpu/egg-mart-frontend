import { useState, useEffect } from 'react'
import { PageHeader, AddButton, TableHeader, StatusBadge, Modal, FormField, inputStyle, ModalActions } from '../components/UI'
import { useApp } from '../App'
import { getCategories, createProduct, updateProduct, deleteProduct } from '../api'

const emptyForm = { name: '', pack: '', price: '', stock: '', category_id: '', emoji: '🥚' }

export default function ProductsPage() {
  // Products now come from the shared store, which App.jsx populates from
  // GET /api/products — this page previously managed its own local/static
  // copy, so every admin change here was invisible to the real system and
  // vanished on refresh.
  const { products, refreshProducts, showToast } = useApp()

  const [categories, setCategories] = useState([])
  const [showAdd,    setShowAdd]    = useState(false)
  const [editing,    setEditing]    = useState(null) // product being edited, or null for "add"
  const [form,       setForm]       = useState(emptyForm)
  const [saving,     setSaving]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null) // product pending delete confirmation

  useEffect(() => {
    getCategories()
      .then(cats => {
        setCategories(cats)
        // Fix: previously defaulted to category: 'white', which doesn't
        // exist in the real category list, so new products silently got an
        // unmatched category. Default to the first real category instead.
        setForm(f => ({ ...f, category_id: f.category_id || String(cats[0]?.id ?? '') }))
      })
      .catch(err => console.error('Failed to load categories:', err))
  }, [])

  function openAdd() {
    setEditing(null)
    setForm({ ...emptyForm, category_id: String(categories[0]?.id ?? '') })
    setShowAdd(true)
  }

  function openEdit(product) {
    setEditing(product)
    setForm({
      name:  product.name,
      pack:  product.pack || '',
      price: String(product.price),
      stock: String(product.stock),
      category_id: String(product.category_id ?? categories.find(c => c.slug === product.category)?.id ?? ''),
      emoji: product.emoji || '🥚',
    })
    setShowAdd(true)
  }

  async function handleSave() {
    if (saving) return // already saving — ignore re-entrant calls (e.g. double-click)
    if (!form.name.trim() || !form.price) {
      showToast('Product name and price are required', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name:  form.name.trim(),
        pack:  form.pack || null,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        emoji: form.emoji || '🥚',
      }
      if (editing) {
        await updateProduct(editing.id, payload)
        showToast('Product updated')
      } else {
        await createProduct(payload)
        showToast('Product added')
      }
      await refreshProducts()
      setShowAdd(false)
      setEditing(null)
      setForm(emptyForm)
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
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: 20 }}>
      <PageHeader
        title="Products"
        action={<AddButton label="Add Product" onClick={openAdd} />}
      />

      <div style={{ background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
          <TableHeader cols={['Product', 'Category', 'Pack', 'Price', 'Stock', 'Status', 'Actions']} />
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.emoji} {p.name}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{p.category_name ?? p.category}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--muted)' }}>{p.pack}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>₹{p.price}</td>
                <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.stock}</td>
                <td style={{ padding: '12px 16px' }}><StatusBadge stock={p.stock} /></td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', marginRight: 8, fontSize: 14 }}><i className="ti ti-edit"></i></button>
                  <button onClick={() => setConfirmDelete(p)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14 }}><i className="ti ti-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <Modal show={showAdd} onClose={() => setShowAdd(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        {[['Product Name', 'name', 'text'], ['Pack Size', 'pack', 'text'], ['Price (₹)', 'price', 'number'], ['Stock Qty', 'stock', 'number']].map(([label, key, type]) => (
          <FormField key={key} label={label}>
            <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
          </FormField>
        ))}
        <FormField label="Category">
          <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} style={inputStyle}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>
        <ModalActions
          onCancel={() => setShowAdd(false)}
          onConfirm={handleSave}
          confirmLabel={saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add Product')}
          disabled={saving}
        />
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
