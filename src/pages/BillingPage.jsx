import { useState, useMemo, useEffect, useRef } from 'react'
import { CATEGORIES } from '../data'
import { Modal, ModalActions } from '../components/UI'
import { useApp } from '../App'
import { getCustomers } from '../api'

/* ─── White Egg dynamic pricing ─── */
function getWhiteEggPrice(qty) {
  if (qty >= 100) return 6.10
  if (qty >= 30)  return 6.25
  return 6.50
}

/* ─── Product Entry Popup ─── */
function ProductEntryPopup({ product, existingItem, onSave, onClose }) {
  const isWhiteEgg = product.name.toLowerCase() === 'white egg'

  const initQty   = existingItem ? existingItem.qty   : 1
  const initPrice = existingItem
    ? existingItem.editPrice
    : (isWhiteEgg ? getWhiteEggPrice(1) : product.price)

  const [qty,          setQtyState]   = useState(String(initQty))
  const [price,        setPriceState] = useState(String(initPrice))
  const [priceOverride,setPriceOverride] = useState(false)

  const numQty   = parseInt(qty)   || 0
  const numPrice = parseFloat(price) || 0
  const lineTotal = numQty * numPrice

  /* Auto-update price when qty changes (only if not manually overridden) */
  function handleQty(val) {
    setQtyState(val)
    if (isWhiteEgg && !priceOverride) {
      const q = parseInt(val) || 0
      setPriceState(String(getWhiteEggPrice(q)))
    }
  }

  function handlePrice(val) {
    setPriceState(val)
    setPriceOverride(true)
  }

  /* Numpad press */
  function numpadPress(field, key) {
    const setter = field === 'qty' ? handleQty : handlePrice
    const cur    = field === 'qty' ? qty        : price

    if (key === '⌫') {
      setter(cur.length > 1 ? cur.slice(0, -1) : '0')
    } else if (key === '.') {
      if (!cur.includes('.')) setter(cur + '.')
    } else if (key === 'C') {
      setter('0')
      if (field === 'price') setPriceOverride(false)
    } else {
      const next = cur === '0' ? key : cur + key
      setter(next)
    }
  }

  /* Which field is active */
  const [activeField, setActiveField] = useState('qty')

  /* Autofocus the quantity field as soon as the popup opens, so the numpad
     starts driving qty immediately (mobile UX requirement). Pure focus
     management — does not touch qty/price calculation logic. */
  const qtyBoxRef = useRef(null)
  useEffect(() => {
    setActiveField('qty')
    qtyBoxRef.current && qtyBoxRef.current.focus()
  }, [])

  const priceTier = isWhiteEgg && !priceOverride
    ? (numQty >= 100 ? '≥100 pcs rate' : numQty >= 30 ? '30–99 pcs rate' : '<30 pcs rate')
    : null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg1)', borderRadius: 16,
        border: '1px solid var(--border)',
        width: '90vw', maxWidth: 360, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 28 }}>{product.emoji}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{product.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{product.pack}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {/* Fields */}
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>

            {/* Qty field */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Quantity</div>
              <div
                ref={qtyBoxRef}
                tabIndex={0}
                onClick={() => setActiveField('qty')}
                onFocus={() => setActiveField('qty')}
                style={{
                  padding: '14px 12px', borderRadius: 8, fontSize: 22, fontWeight: 700,
                  textAlign: 'center', cursor: 'pointer', outline: 'none',
                  minHeight: 48,
                  border: `2px solid ${activeField === 'qty' ? 'var(--green)' : 'var(--border)'}`,
                  background: activeField === 'qty' ? 'var(--green-dim)' : 'var(--bg2)',
                  color: activeField === 'qty' ? 'var(--green)' : 'var(--text)',
                }}
              >{qty}</div>
            </div>

            {/* Price field */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                Price / Unit {priceTier && <span style={{ color: 'var(--green)', fontSize: 10 }}>({priceTier})</span>}
              </div>
              <div
                onClick={() => setActiveField('price')}
                style={{
                  padding: '14px 12px', borderRadius: 8, fontSize: 22, fontWeight: 700,
                  textAlign: 'center', cursor: 'pointer',
                  minHeight: 48,
                  border: `2px solid ${activeField === 'price' ? 'var(--green)' : 'var(--border)'}`,
                  background: activeField === 'price' ? 'var(--green-dim)' : 'var(--bg2)',
                  color: activeField === 'price' ? 'var(--green)' : 'var(--text)',
                }}
              >₹{price}</div>
            </div>
          </div>

          {/* Total preview */}
          <div style={{
            background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
          }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>₹{lineTotal.toFixed(2)}</span>
          </div>

          {/* Numpad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
            {['1','2','3','4','5','6','7','8','9','.','0','⌫'].map(k => (
              <button key={k} onClick={() => numpadPress(activeField, k)} style={{
                padding: '16px 0', borderRadius: 8, fontSize: 19, fontWeight: 600,
                minHeight: 48,
                border: '1px solid var(--border)',
                background: k === '⌫' ? 'var(--bg3)' : 'var(--bg2)',
                color: k === '⌫' ? 'var(--red)' : 'var(--text)',
                cursor: 'pointer',
              }}>{k}</button>
            ))}
            <button onClick={() => numpadPress(activeField, 'C')} style={{
              gridColumn: '1 / -1', padding: '10px 0', borderRadius: 8, fontSize: 13,
              minHeight: 44,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: 'var(--amber)', cursor: 'pointer', fontWeight: 500,
            }}>Clear</button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
          <button onClick={onClose} style={{
            padding: '14px', borderRadius: 10, fontSize: 14,
            minHeight: 48,
            border: '1px solid var(--border)', background: 'var(--bg2)',
            color: 'var(--text2)', cursor: 'pointer',
          }}>Cancel</button>
          <button
            onClick={() => numQty > 0 && numPrice > 0 && onSave(numQty, numPrice)}
            disabled={numQty <= 0 || numPrice <= 0}
            style={{
              padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              minHeight: 48,
              border: 'none',
              background: numQty > 0 && numPrice > 0 ? 'var(--green)' : 'var(--bg3)',
              color: numQty > 0 && numPrice > 0 ? '#0a1a0a' : 'var(--muted)',
              cursor: numQty > 0 && numPrice > 0 ? 'pointer' : 'default',
            }}
          >
            <i className="ti ti-shopping-cart-plus" style={{ marginRight: 6 }}></i>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main BillingPage ─── */
export default function BillingPage() {
  const {
    products, tax, productView, addTransaction, showToast,
    cart, setCart, heldBills, setHeldBills,
    billCustomerName: customerName, setBillCustomerName: setCustomerName,
    billDiscount: discount, setBillDiscount: setDiscount,
  } = useApp()

  const [payModal,    setPayModal]    = useState(false)
  const [payMethod,   setPayMethod]   = useState('Cash')
  const [collected,   setCollected]   = useState('')
  const [paidSuccess, setPaidSuccess] = useState(false)
  const [showHeld,    setShowHeld]    = useState(false)
  const [search,      setSearch]      = useState('')
  const [category,    setCategory]    = useState('all')

  /* Credit payment — requires picking an existing customer so credit_limit /
     credit_used can be tracked. Customer list is fetched lazily the first
     time "Credit" is selected, not on every page load. */
  const [creditCustomers,  setCreditCustomers]  = useState([])
  const [creditCustomerId, setCreditCustomerId] = useState(null)
  const [creditSearch,     setCreditSearch]     = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  useEffect(() => {
    if (payMethod !== 'Credit' || creditCustomers.length > 0) return
    setLoadingCustomers(true)
    getCustomers()
      .then(res => setCreditCustomers(res?.data ?? []))
      .catch(() => showToast('Failed to load customers', 'error'))
      .finally(() => setLoadingCustomers(false))
  }, [payMethod])

  const selectedCreditCustomer = creditCustomers.find(c => c.id === creditCustomerId) || null

  /* ── Mobile/UX state (presentation only — no billing/cart math here) ── */
  const [cartCollapsed, setCartCollapsed] = useState(false) // cart auto-minimizes after each add
  const [justAdded,     setJustAdded]     = useState(null)  // brief "Product added" confirmation
  const [isMobile,      setIsMobile]      = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )
  useEffect(() => {
    function onResize() { setIsMobile(window.innerWidth <= 768) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* Product entry popup state */
  const [popupProduct, setPopupProduct] = useState(null)

  const filtered = useMemo(() => products.filter(p => {
    const matchCat    = category === 'all' || p.category === category
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.pack.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }), [category, search, products])

  /* Open popup — if product already in cart, pass existing item for editing */
  function openProductPopup(product) {
    setPopupProduct(product)
  }

  /* Save from popup: add or update cart */
  function handlePopupSave(product, qty, price) {
    // Client-side stock check. Previously stock was only checked server-side
    // at checkout, so a fully built, discounted cart could fail at the very
    // last step. `qty` here is the *total* quantity for this line (the popup
    // edits the whole line, not an increment), so it's compared directly
    // against the product's known stock.
    if (qty > (product.stock ?? 0)) {
      showToast(`Only ${product.stock ?? 0} of "${product.name}" in stock`, 'error')
      return
    }

    setCart(prev => {
      const ex = prev.find(i => i.id === product.id)
      if (ex) {
        return prev.map(i => i.id === product.id
          ? { ...i, qty, editPrice: price }
          : i
        )
      }
      return [...prev, { ...product, qty, editPrice: price }]
    })
    setPopupProduct(null)

    /* Mobile/efficient-flow UX: confirm the add, then auto-minimize the
       cart so the product list stays front-and-center for the next pick. */
    setJustAdded(product.name)
    setTimeout(() => setJustAdded(null), 1800)
    if (isMobile) setCartCollapsed(true)
  }

  function removeItem(id) {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const subtotal    = cart.reduce((s, i) => s + i.editPrice * i.qty, 0)
  const discountAmt = Math.round(subtotal * discount / 100)
  const taxAmt      = Math.round((subtotal - discountAmt) * tax / 100)
  const total       = subtotal - discountAmt + taxAmt
  const balance     = collected ? parseFloat(collected) - total : 0
  const effectiveName = customerName.trim() || 'Walk-in Customer'

  async function handlePay() {
    if (payMethod === 'Credit') {
      if (!selectedCreditCustomer) {
        showToast('Select a customer for the credit sale', 'error')
        return
      }
      const available = Number(selectedCreditCustomer.credit_limit) - Number(selectedCreditCustomer.credit_used)
      if (total > available) {
        showToast(`Credit limit exceeded: ₹${available.toFixed(2)} available for ${selectedCreditCustomer.name}`, 'error')
        return
      }
    }

    const tx = {
      date:        new Date(),
      customer:    payMethod === 'Credit' ? selectedCreditCustomer.name : effectiveName,
      customerId:  payMethod === 'Credit' ? selectedCreditCustomer.id : null,
      items:       cart.length,
      total,
      subtotal,
      tax:         taxAmt,
      discount:    discountAmt,
      discountPct: discount,
      method:      payMethod,
      status:      payMethod === 'Credit' ? 'credit' : 'paid',
      cart:        [...cart],
    }
    const result = await addTransaction(tx)
    if (result) {
      setCart([]); setDiscount(0); setPayModal(false)
      setCollected(''); setCustomerName(''); setPayMethod('Cash')
      setCreditCustomerId(null); setCreditSearch('')
      setPaidSuccess(true)
      setTimeout(() => setPaidSuccess(false), 2500)
    }
  }

  function holdBill() {
    if (cart.length === 0) return
    setHeldBills(prev => [...prev, { id: Date.now(), cart, customerName, total }])
    setCart([]); setDiscount(0); setCustomerName('')
  }

  function resumeBill(bill) {
    setCart(bill.cart); setCustomerName(bill.customerName || ''); setDiscount(0)
    setHeldBills(prev => prev.filter(b => b.id !== bill.id))
    setShowHeld(false)
  }

  const isList = productView === 'list'

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes ayiniToastIn {
          from { opacity: 0; transform: translateY(-8px) ${isMobile ? 'translateX(-50%)' : ''}; }
          to   { opacity: 1; transform: translateY(0) ${isMobile ? 'translateX(-50%)' : ''}; }
        }
        .ayini-added-toast { animation: ayiniToastIn 0.22s ease-out; }
        .ayini-cart-panel { will-change: max-height, width; }
      `}</style>

      {/* ── Product Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        {/* Search + Customer Name */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--border)',
          display: 'flex', flexDirection: isMobile ? 'column' : 'row',
          gap: 10, alignItems: isMobile ? 'stretch' : 'center', flexShrink: 0,
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 16 }}></i>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or scan barcode..."
              style={{ width: '100%', padding: isMobile ? '12px 12px 12px 36px' : '8px 12px 8px 34px', minHeight: isMobile ? 44 : 'auto', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: isMobile ? 14 : 13, outline: 'none' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <i className="ti ti-user" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 14 }}></i>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              style={{ padding: isMobile ? '12px 12px 12px 34px' : '8px 12px 8px 32px', minHeight: isMobile ? 44 : 'auto', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: isMobile ? 14 : 13, outline: 'none', width: isMobile ? '100%' : 200 }} />
          </div>
        </div>

        {/* Category Tabs (kept sticky/visible for quick access while picking products) */}
        <div style={{ padding: '10px 16px', display: 'flex', gap: 6, flexShrink: 0, overflowX: 'auto', position: 'sticky', top: 0, background: 'var(--bg1)', zIndex: 5 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} style={{
              padding: isMobile ? '10px 16px' : '6px 14px', borderRadius: 20,
              minHeight: isMobile ? 40 : 'auto',
              border: `1px solid ${category === c.id ? 'var(--green)' : 'var(--border)'}`,
              background: category === c.id ? 'var(--green-dim)' : 'var(--bg2)',
              color: category === c.id ? 'var(--green)' : 'var(--text2)',
              fontSize: isMobile ? 13 : 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{c.label}</button>
          ))}
        </div>

        {/* Products: Grid or List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 12px' }}>
          {isList ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {filtered.map(p => {
                const inCart = cart.find(i => i.id === p.id)
                return (
                  <div key={p.id} onClick={() => openProductPopup(p)} style={{
                    background: inCart ? 'var(--green-dim)' : 'var(--bg2)',
                    borderRadius: 10,
                    border: `1px solid ${inCart ? 'var(--green)' : 'var(--border)'}`,
                    padding: isMobile ? '14px 14px' : '10px 14px', minHeight: isMobile ? 56 : 'auto',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                  }}>
                    <div style={{ fontSize: 28, width: 36, textAlign: 'center' }}>{p.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.pack}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>₹{p.price.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: p.stock > 50 ? 'var(--green-text)' : 'var(--amber)' }}>Stock: {p.stock}</div>
                    </div>
                    {inCart
                      ? <div style={{ width: isMobile ? 34 : 28, height: isMobile ? 34 : 28, borderRadius: 6, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a1a0a', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{inCart.qty}</div>
                      : <div style={{ width: isMobile ? 34 : 28, height: isMobile ? 34 : 28, borderRadius: 6, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a1a0a', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>+</div>
                    }
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(auto-fill,minmax(140px,1fr))' : 'repeat(auto-fill,minmax(148px,1fr))',
              gap: isMobile ? 8 : 10, alignContent: 'start', marginTop: 4,
            }}>
              {filtered.map(p => {
                const inCart = cart.find(i => i.id === p.id)
                return (
                  <div key={p.id} onClick={() => openProductPopup(p)} style={{
                    background: inCart ? 'var(--green-dim)' : 'var(--bg2)',
                    borderRadius: 12,
                    border: `1px solid ${inCart ? 'var(--green)' : 'var(--border)'}`,
                    padding: isMobile ? '14px' : '12px', cursor: 'pointer', position: 'relative',
                    minHeight: isMobile ? 64 : 'auto',
                  }}>
                    {inCart && (
                      <div style={{ position: 'absolute', top: 6, right: 6, background: 'var(--green)', color: '#0a1a0a', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>×{inCart.qty}</div>
                    )}
                    <div style={{ width: '100%', height: 70, background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, fontSize: 36 }}>
                      {p.emoji}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{p.pack}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>₹{p.price.toFixed(2)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: p.stock > 50 ? 'var(--green-text)' : 'var(--amber)' }}>Stock: {p.stock}</span>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a1a0a', fontSize: 16, fontWeight: 600 }}>+</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
          {[
            { label: 'Hold Bill',             icon: 'player-pause', color: 'var(--text2)', action: holdBill },
            { label: `Held (${heldBills.length})`, icon: 'clock', color: 'var(--blue)',   action: () => setShowHeld(true) },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} style={{
              flex: 1, padding: isMobile ? '12px' : '8px', borderRadius: 8,
              minHeight: isMobile ? 44 : 'auto',
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: btn.color, fontSize: isMobile ? 13 : 12, cursor: 'pointer',
            }}>
              <i className={`ti ti-${btn.icon}`} style={{ marginRight: 4 }}></i>{btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Cart Panel ── */}
      <div
        className="ayini-cart-panel"
        style={{
          width: isMobile && cartCollapsed ? '100%' : (isMobile ? '100%' : 310),
          maxHeight: isMobile && cartCollapsed ? 56 : (isMobile ? '60vh' : 'none'),
          background: 'var(--bg1)',
          borderLeft: isMobile ? 'none' : '1px solid var(--border)',
          borderTop: isMobile ? '1px solid var(--border)' : 'none',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          transition: 'max-height 0.28s ease, width 0.28s ease',
          overflow: 'hidden',
        }}
      >
        <div
          onClick={() => isMobile && setCartCollapsed(c => !c)}
          style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, cursor: isMobile ? 'pointer' : 'default',
            minHeight: 48,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Current Bill</div>
            {isMobile && cart.length > 0 && (
              <span style={{ background: 'var(--green)', color: '#0a1a0a', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '2px 7px' }}>
                {cart.length}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && cartCollapsed && (
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>₹{total.toFixed(2)}</span>
            )}
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              <i className="ti ti-user" style={{ marginRight: 4 }}></i>
              {effectiveName}
            </div>
            {isMobile && (
              <i className={`ti ti-chevron-${cartCollapsed ? 'up' : 'down'}`} style={{ fontSize: 16, color: 'var(--muted)' }}></i>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: '2rem' }}>
              <i className="ti ti-shopping-cart" style={{ fontSize: 32, display: 'block', marginBottom: 8 }}></i>
              Cart is empty<br /><span style={{ fontSize: 11 }}>Tap a product to add</span>
            </div>
          ) : cart.map(item => (
            <div key={item.id} onClick={() => openProductPopup(item)} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontSize: 20 }}>{item.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name} ({item.pack})</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    ₹{item.editPrice.toFixed(2)} × {item.qty}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>₹{(item.editPrice * item.qty).toFixed(2)}</span>
                  <button onClick={e => { e.stopPropagation(); removeItem(item.id) }} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 8, minWidth: 32, minHeight: 32 }}>
                    <i className="ti ti-trash" style={{ fontSize: 15 }}></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
            <span>Subtotal</span><span style={{ color: 'var(--text)' }}>₹{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
            <span>Discount</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" min="0" max="100" value={discount}
                onChange={e => setDiscount(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                style={{ width: 40, padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg3)', color: 'var(--text)', fontSize: 11, textAlign: 'center', outline: 'none' }} />
              <span>%</span>
              <span style={{ color: 'var(--red)' }}>−₹{discountAmt.toFixed(2)}</span>
            </span>
          </div>
          {tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
              <span>Tax ({tax}%)</span><span style={{ color: 'var(--amber)' }}>+₹{taxAmt.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700, color: 'var(--green)', marginBottom: 12, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <span>Total</span><span>₹{total.toFixed(2)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <button onClick={() => setCart([])} style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--red)', background: 'transparent', color: 'var(--red)', fontSize: 12, cursor: 'pointer' }}>
              <i className="ti ti-x" style={{ marginRight: 4 }}></i>Clear
            </button>
            <button onClick={holdBill} style={{ padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
              <i className="ti ti-player-pause" style={{ marginRight: 4 }}></i>Hold
            </button>
          </div>
          <button onClick={() => cart.length > 0 && setPayModal(true)} style={{
            width: '100%', padding: isMobile ? '15px' : '12px', borderRadius: 10,
            minHeight: isMobile ? 50 : 'auto',
            background: cart.length > 0 ? 'var(--green)' : 'var(--bg3)',
            color: cart.length > 0 ? '#0a1a0a' : 'var(--muted)',
            fontSize: isMobile ? 16 : 15, fontWeight: 600, border: 'none',
            cursor: cart.length > 0 ? 'pointer' : 'default',
          }}>
            Checkout ₹{total.toFixed(2)} <i className="ti ti-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* ── Product Entry Popup ── */}
      {popupProduct && (
        <ProductEntryPopup
          product={popupProduct}
          existingItem={cart.find(i => i.id === popupProduct.id) || null}
          onSave={(qty, price) => handlePopupSave(popupProduct, qty, price)}
          onClose={() => setPopupProduct(null)}
        />
      )}

      {/* Success Toast */}
      {paidSuccess && (
        <div style={{ position: 'absolute', top: 20, right: 20, background: 'var(--green)', color: '#0a1a0a', padding: '12px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 100 }}>
          <i className="ti ti-check" style={{ marginRight: 6 }}></i>Payment Successful!
        </div>
      )}

      {/* "Product added" Toast — confirms each add without blocking the next selection */}
      {justAdded && (
        <div
          className="ayini-added-toast"
          style={{
            position: 'absolute',
            top: isMobile ? 12 : 20,
            left: isMobile ? '50%' : 'auto',
            right: isMobile ? 'auto' : 20,
            transform: isMobile ? 'translateX(-50%)' : 'none',
            background: 'var(--green)', color: '#0a1a0a',
            padding: '10px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13,
            zIndex: 100, whiteSpace: 'nowrap', boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          }}
        >
          <i className="ti ti-check" style={{ marginRight: 6 }}></i>{justAdded} added successfully
        </div>
      )}

      {/* ── Payment Popup ── */}
      <Modal show={payModal} onClose={() => setPayModal(false)} title="Checkout" width={420}>
        <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
            <span>Customer</span><span style={{ color: 'var(--text)' }}>{effectiveName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
            <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discountAmt > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--red)', marginBottom: 6 }}>
              <span>Discount</span><span>−₹{discountAmt.toFixed(2)}</span>
            </div>
          )}
          {taxAmt > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--amber)', marginBottom: 6 }}>
              <span>Tax ({tax}%)</span><span>+₹{taxAmt.toFixed(2)}</span>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>
            <span>Bill Amount</span><span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>Payment Method</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          {[['Cash', 'cash'], ['Card', 'credit-card'], ['UPI', 'qrcode'], ['Credit', 'notes']].map(([m, icon]) => (
            <button key={m} onClick={() => setPayMethod(m)} style={{
              padding: '12px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500,
              border: `1.5px solid ${payMethod === m ? 'var(--green)' : 'var(--border)'}`,
              background: payMethod === m ? 'var(--green-dim)' : 'var(--bg2)',
              color: payMethod === m ? 'var(--green)' : 'var(--text)',
            }}>
              <i className={`ti ti-${icon}`} style={{ display: 'block', fontSize: 20, marginBottom: 4 }}></i>{m}
            </button>
          ))}
        </div>

        {payMethod === 'Credit' && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Customer (required for credit)</div>
            <input
              value={creditSearch}
              onChange={e => { setCreditSearch(e.target.value); setCreditCustomerId(null) }}
              placeholder={loadingCustomers ? 'Loading customers…' : 'Search customer by name or phone...'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 13, outline: 'none', marginBottom: 6 }}
            />
            {creditSearch && !selectedCreditCustomer && (
              <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 6 }}>
                {creditCustomers
                  .filter(c => c.name.toLowerCase().includes(creditSearch.toLowerCase()) || c.phone?.includes(creditSearch))
                  .slice(0, 8)
                  .map(c => (
                    <div key={c.id} onClick={() => { setCreditCustomerId(c.id); setCreditSearch(c.name) }}
                      style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}>
                      {c.name} {c.phone ? `· ${c.phone}` : ''}
                      <span style={{ float: 'right', fontSize: 11, color: 'var(--muted)' }}>
                        ₹{(Number(c.credit_limit) - Number(c.credit_used)).toFixed(0)} available
                      </span>
                    </div>
                  ))}
                {creditCustomers.filter(c => c.name.toLowerCase().includes(creditSearch.toLowerCase()) || c.phone?.includes(creditSearch)).length === 0 && (
                  <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted)' }}>No matching customers. Add them under Customers first.</div>
                )}
              </div>
            )}
            {selectedCreditCustomer && (
              <div style={{ fontSize: 12, color: 'var(--green)', background: 'var(--green-dim)', borderRadius: 8, padding: '8px 12px' }}>
                <i className="ti ti-check" style={{ marginRight: 6 }}></i>
                {selectedCreditCustomer.name} · ₹{(Number(selectedCreditCustomer.credit_limit) - Number(selectedCreditCustomer.credit_used)).toFixed(2)} credit available
              </div>
            )}
          </div>
        )}

        {payMethod !== 'Credit' && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Amount Received from Customer (₹)</div>
            <input type="number" value={collected} onChange={e => setCollected(e.target.value)}
              placeholder={`Enter amount (Bill: ₹${total.toFixed(2)})`}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: 15, outline: 'none' }} />
          </div>
        )}

        {payMethod !== 'Credit' && collected !== '' && (
          <div style={{
            borderRadius: 8, padding: '12px 14px', marginBottom: 12,
            background: balance >= 0 ? 'var(--green-dim)' : '#1a0a0a',
            border: `1px solid ${balance >= 0 ? 'var(--green)' : 'var(--red)'}`,
          }}>
            {balance >= 0 ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--green)' }}>
                  <i className="ti ti-coins" style={{ marginRight: 6 }}></i>Balance to Return
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>₹{balance.toFixed(2)}</span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--red)' }}>
                <i className="ti ti-alert-triangle" style={{ marginRight: 6 }}></i>
                Amount short by ₹{Math.abs(balance).toFixed(2)}
              </div>
            )}
          </div>
        )}

        <ModalActions
          onCancel={() => setPayModal(false)}
          onConfirm={handlePay}
          confirmLabel={payMethod === 'Credit' ? 'Confirm Credit Sale' : `Confirm ${payMethod} Pay`}
          disabled={payMethod === 'Credit' && !selectedCreditCustomer}
        />
      </Modal>

      {/* Held Bills Modal */}
      <Modal show={showHeld} onClose={() => setShowHeld(false)} title="Held Bills">
        {heldBills.length === 0
          ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>No held bills</div>
          : heldBills.map(b => (
            <div key={b.id} onClick={() => resumeBill(b)} style={{ padding: '12px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 8, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--blue)' }}>{b.customerName || 'Walk-in Customer'}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>₹{b.total.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{b.cart.length} items · Click to resume</div>
            </div>
          ))
        }
      </Modal>
    </div>
  )
}
