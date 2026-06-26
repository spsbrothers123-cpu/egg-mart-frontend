// src/pages/BillingPage.jsx
// Complete mobile-first rewrite of the Egg Mart POS Billing Page
// Matches the existing dark theme visible in the screenshot
// Drop this file directly into src/pages/BillingPage.jsx

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Product Data — all 33 products ──────────────────────────────────────────
const PRODUCTS = [
  // EGGS — individual
  { id: 1,  name: "White Egg",         desc: "1 Pc",    price: 6.50,  category: "Eggs",    emoji: "🥚", stock: 500 },
  { id: 2,  name: "Brown Egg",         desc: "1 Pc",    price: 7.00,  category: "Eggs",    emoji: "🥚", stock: 400 },
  { id: 3,  name: "Country/Desi Egg",  desc: "1 Pc",    price: 12.00, category: "Eggs",    emoji: "🥚", stock: 200 },
  { id: 4,  name: "Organic Egg",       desc: "1 Pc",    price: 15.00, category: "Eggs",    emoji: "🥚", stock: 150 },
  { id: 5,  name: "Duck Egg",          desc: "1 Pc",    price: 14.00, category: "Eggs",    emoji: "🥚", stock: 80  },
  { id: 6,  name: "Quail Egg",         desc: "1 Pc",    price: 4.50,  category: "Eggs",    emoji: "🥚", stock: 300 },
  // EGGS — packs
  { id: 7,  name: "White Eggs",        desc: "Pack 6",  price: 38.00, category: "Packs",   emoji: "📦", stock: 120 },
  { id: 8,  name: "White Eggs",        desc: "Pack 12", price: 72.00, category: "Packs",   emoji: "📦", stock: 90  },
  { id: 9,  name: "Brown Eggs",        desc: "Pack 6",  price: 42.00, category: "Packs",   emoji: "📦", stock: 100 },
  { id: 10, name: "Country Eggs",      desc: "Pack 6",  price: 68.00, category: "Packs",   emoji: "📦", stock: 60  },
  { id: 11, name: "Organic Eggs",      desc: "Pack 6",  price: 88.00, category: "Packs",   emoji: "📦", stock: 50  },
  { id: 12, name: "Quail Eggs",        desc: "Pack 20", price: 88.00, category: "Packs",   emoji: "📦", stock: 75  },
  // EGGS — trays
  { id: 13, name: "White Eggs",        desc: "Tray 30", price: 195.00,category: "Trays",   emoji: "🥚", stock: 60  },
  { id: 14, name: "Brown Eggs",        desc: "Tray 30", price: 210.00,category: "Trays",   emoji: "🥚", stock: 40  },
  { id: 15, name: "Country Eggs",      desc: "Tray 30", price: 355.00,category: "Trays",   emoji: "🥚", stock: 30  },
  { id: 16, name: "Jumbo Eggs",        desc: "Tray 30", price: 220.00,category: "Trays",   emoji: "🥚", stock: 25  },
  { id: 17, name: "Medium Eggs",       desc: "Tray 30", price: 165.00,category: "Trays",   emoji: "🥚", stock: 45  },
  { id: 18, name: "Omega-3 Eggs",      desc: "Tray 30", price: 245.00,category: "Trays",   emoji: "🥚", stock: 20  },
  // EGG PRODUCTS
  { id: 19, name: "Boiled Eggs",       desc: "Pack 6",  price: 50.00, category: "Products",emoji: "🍳", stock: 40  },
  { id: 20, name: "Pickled Eggs",      desc: "Jar 12",  price: 130.00,category: "Products",emoji: "🫙", stock: 20  },
  { id: 21, name: "Liquid Whole Egg",  desc: "1 Litre", price: 95.00, category: "Products",emoji: "🥛", stock: 30  },
  { id: 22, name: "Egg White Liquid",  desc: "500 ml",  price: 80.00, category: "Products",emoji: "🥛", stock: 25  },
  { id: 23, name: "Egg Yolk Liquid",   desc: "500 ml",  price: 75.00, category: "Products",emoji: "🥛", stock: 25  },
  { id: 24, name: "Egg Powder",        desc: "200 g",   price: 160.00,category: "Products",emoji: "🫙", stock: 35  },
  { id: 25, name: "Pasteurised Eggs",  desc: "Dozen",   price: 130.00,category: "Products",emoji: "📦", stock: 30  },
  // DAIRY
  { id: 26, name: "Full Cream Milk",   desc: "1 Litre", price: 68.00, category: "Dairy",   emoji: "🥛", stock: 60  },
  { id: 27, name: "Toned Milk",        desc: "500 ml",  price: 30.00, category: "Dairy",   emoji: "🥛", stock: 80  },
  { id: 28, name: "Butter",            desc: "500 g",   price: 240.00,category: "Dairy",   emoji: "🧈", stock: 20  },
  { id: 29, name: "Paneer",            desc: "200 g",   price: 90.00, category: "Dairy",   emoji: "🧀", stock: 15  },
  { id: 30, name: "Curd/Yoghurt",      desc: "400 g",   price: 45.00, category: "Dairy",   emoji: "🫙", stock: 40  },
  { id: 31, name: "Cheese Slices",     desc: "200 g",   price: 120.00,category: "Dairy",   emoji: "🧀", stock: 18  },
  // FEED
  { id: 32, name: "Layer Feed",        desc: "25 kg",   price: 950.00,category: "Feed",    emoji: "🌾", stock: 10  },
  { id: 33, name: "Starter Feed",      desc: "25 kg",   price: 900.00,category: "Feed",    emoji: "🌾", stock: 8   },
];

const CATEGORIES = ["All", "Eggs", "Packs", "Trays", "Products", "Dairy", "Feed"];

const fmt = (n) => `₹${Number(n).toFixed(2)}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QtyModal({ product, onConfirm, onClose }) {
  const [qty, setQty] = useState(1);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

  const pad = (n) => {
    const arr = [];
    for (let i = 1; i <= n; i++) arr.push(i);
    return arr;
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={S.modalEmoji}>{product.emoji}</span>
          <div>
            <div style={S.modalName}>{product.name}</div>
            <div style={S.modalMeta}>{product.desc} · {fmt(product.price)} each</div>
          </div>
        </div>

        {/* Quick-tap quantity grid */}
        <div style={S.qtyGrid}>
          {[1, 2, 5, 10, 15, 20, 25, 30].map((n) => (
            <button
              key={n}
              style={{ ...S.qtyChip, ...(qty === n ? S.qtyChipActive : {}) }}
              onClick={() => setQty(n)}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Manual input */}
        <div style={S.qtyInputRow}>
          <button style={S.qtyStepBtn} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            min="1"
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            style={S.qtyManualInput}
          />
          <button style={S.qtyStepBtn} onClick={() => setQty((q) => q + 1)}>+</button>
        </div>

        <div style={S.modalTotal}>
          Total: <strong style={{ color: C.green }}>{fmt(product.price * qty)}</strong>
        </div>

        <button style={S.confirmBtn} onClick={() => onConfirm(qty)}>
          ✓ Add {qty} × {product.name}
        </button>
        <button style={S.cancelBtn} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

function CartItem({ item, onChange, onRemove }) {
  return (
    <div style={S.cartRow}>
      <div style={S.cartRowLeft}>
        <span style={S.cartEmoji}>{item.product.emoji}</span>
        <div>
          <div style={S.cartName}>{item.product.name}</div>
          <div style={S.cartMeta}>{fmt(item.product.price)} × {item.qty}</div>
        </div>
      </div>
      <div style={S.cartRowRight}>
        <span style={S.cartLineTotal}>{fmt(item.product.price * item.qty)}</span>
        <button style={S.cartRemove} onClick={() => onRemove(item.product.id)}>🗑</button>
      </div>
    </div>
  );
}

function CheckoutModal({ cart, total, discount, onDiscountChange, onPay, onClose }) {
  const [method, setMethod] = useState("Cash");
  const [tendered, setTendered] = useState("");
  const METHODS = ["Cash", "Card", "UPI"];
  const discountAmt = total * (discount / 100);
  const finalTotal = total - discountAmt;
  const change = method === "Cash" ? Math.max(0, (parseFloat(tendered) || 0) - finalTotal) : 0;

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxHeight: "92vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={S.checkoutTitle}>Checkout</div>

        {/* Items summary */}
        <div style={S.checkoutItems}>
          {cart.map((i) => (
            <div key={i.product.id} style={S.checkoutItemRow}>
              <span style={S.checkoutItemName}>{i.product.name} × {i.qty}</span>
              <span style={S.checkoutItemAmt}>{fmt(i.product.price * i.qty)}</span>
            </div>
          ))}
        </div>

        {/* Discount */}
        <div style={S.discountRow}>
          <span style={S.discountLabel}>Discount (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            value={discount}
            onChange={(e) => onDiscountChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
            style={S.discountInput}
          />
          <span style={{ color: C.red, fontWeight: 700, fontSize: 14 }}>−{fmt(discountAmt)}</span>
        </div>

        <div style={S.checkoutTotal}>
          <span>Total</span>
          <span style={{ color: C.green, fontSize: 22, fontWeight: 800 }}>{fmt(finalTotal)}</span>
        </div>

        {/* Payment method */}
        <div style={S.methodRow}>
          {METHODS.map((m) => (
            <button
              key={m}
              style={{ ...S.methodBtn, ...(method === m ? S.methodBtnActive : {}) }}
              onClick={() => setMethod(m)}
            >
              {m === "Cash" ? "💵" : m === "Card" ? "💳" : "📱"} {m}
            </button>
          ))}
        </div>

        {method === "Cash" && (
          <div style={S.tenderedRow}>
            <span style={S.discountLabel}>Cash tendered</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder={fmt(finalTotal)}
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              style={S.discountInput}
            />
            {parseFloat(tendered) > 0 && (
              <span style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>
                Change: {fmt(change)}
              </span>
            )}
          </div>
        )}

        <button style={S.payBtn} onClick={() => onPay(method, finalTotal)}>
          ✓ Confirm Payment · {fmt(finalTotal)}
        </button>
        <button style={S.cancelBtn} onClick={onClose}>Back</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BillingPage() {
  const width = useWindowWidth();
  const isMobile = width < 768;

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [qtyModal, setQtyModal] = useState(null);   // product being qty-picked
  const [cartOpen, setCartOpen] = useState(false);  // mobile cart drawer
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [toast, setToast] = useState(null);
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [paidBill, setPaidBill] = useState(null);   // receipt

  const filtered = PRODUCTS.filter((p) => {
    const matchCat = category === "All" || p.category === category;
    const matchQ   = p.name.toLowerCase().includes(search.toLowerCase()) ||
                     p.desc.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const subtotal   = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartCount  = cart.reduce((s, i) => s + i.qty, 0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleTapProduct = (product) => {
    if (product.stock === 0) return;
    setQtyModal(product);
  };

  const handleAddToCart = (product, qty) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product, qty }];
    });
    setQtyModal(null);
    showToast(`${qty} × ${product.name} added`);
  };

  const handleQtyChange = (id, newQty) => {
    if (newQty < 1) return;
    setCart((prev) => prev.map((i) => i.product.id === id ? { ...i, qty: newQty } : i));
  };

  const handleRemove = (id) => setCart((prev) => prev.filter((i) => i.product.id !== id));

  const handleClear = () => {
    if (cart.length && window.confirm("Clear current bill?")) {
      setCart([]);
      setDiscount(0);
      setCartOpen(false);
    }
  };

  const handlePay = (method, total) => {
    setPaidBill({ cart: [...cart], total, method, time: new Date() });
    setCart([]);
    setDiscount(0);
    setCheckoutOpen(false);
    setCartOpen(false);
  };

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      {/* Toast */}
      {toast && <div style={S.toast}>✓ {toast}</div>}

      {/* ── Top bar ── */}
      <div style={S.topBar}>
        <div style={S.topBarLeft}>
          <div style={S.topBarDate}>📅 {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
          <div style={S.topBarStatus}>● Online · Synced</div>
        </div>
        <div style={S.topBarRight}>
          <span style={S.customerBadge}>👤 {customer}</span>
        </div>
      </div>

      {/* ── Search + Category bar ── */}
      <div style={S.controlBar}>
        <div style={S.searchWrap}>
          <span style={S.searchIcon}>🔍</span>
          <input
            style={S.searchInput}
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button style={S.clearSearch} onClick={() => setSearch("")}>✕</button>}
        </div>

        <div style={S.catBar}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              style={{ ...S.catChip, ...(category === cat ? S.catChipActive : {}) }}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product grid + Bill panel ── */}
      <div style={{ ...S.main, flexDirection: isMobile ? "column" : "row" }}>

        {/* PRODUCT GRID */}
        <div style={{ ...S.gridPanel, width: isMobile ? "100%" : "58%" }}>
          {filtered.length === 0 ? (
            <div style={S.noResults}>No products found</div>
          ) : (
            <div style={S.productGrid}>
              {filtered.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id);
                return (
                  <div
                    key={p.id}
                    style={{
                      ...S.productCard,
                      ...(p.stock === 0 ? S.productCardOut : {}),
                      ...(inCart ? S.productCardInCart : {}),
                    }}
                    onClick={() => handleTapProduct(p)}
                  >
                    {inCart && <div style={S.cartQtyBadge}>{inCart.qty}</div>}
                    <div style={S.productEmoji}>{p.emoji}</div>
                    <div style={S.productName}>{p.name}</div>
                    <div style={S.productDesc}>{p.desc}</div>
                    <div style={S.productPrice}>{fmt(p.price)}</div>
                    <div style={{ ...S.stockBadge, color: p.stock > 0 ? C.green : C.red }}>
                      {p.stock > 0 ? `Stock: ${p.stock}` : "Out of Stock"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BILL PANEL — desktop always visible, mobile = drawer */}
        {!isMobile ? (
          <div style={{ ...S.billPanel, width: "42%" }}>
            <BillContent
              cart={cart}
              subtotal={subtotal}
              discount={discount}
              onDiscountChange={setDiscount}
              onQtyChange={handleQtyChange}
              onRemove={handleRemove}
              onClear={handleClear}
              onCheckout={() => setCheckoutOpen(true)}
            />
          </div>
        ) : null}
      </div>

      {/* ── Mobile bottom cart bar ── */}
      {isMobile && (
        <div style={S.mobileCartBar}>
          {cart.length > 0 ? (
            <>
              <button style={S.mobileCartBtn} onClick={() => setCartOpen(true)}>
                <span style={S.mobileCartIcon}>🛒</span>
                <span style={S.mobileCartLabel}>{cartCount} item{cartCount !== 1 ? "s" : ""} · {fmt(subtotal)}</span>
                <span style={S.mobileCartArrow}>▲ View Bill</span>
              </button>
            </>
          ) : (
            <div style={S.mobileCartEmpty}>
              Tap any product to add to bill
            </div>
          )}
        </div>
      )}

      {/* ── Mobile bill drawer ── */}
      {isMobile && cartOpen && (
        <div style={S.drawerOverlay} onClick={() => setCartOpen(false)}>
          <div style={S.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={S.drawerHandle} />
            <div style={S.drawerHeader}>
              <span style={S.drawerTitle}>Current Bill</span>
              <button style={S.drawerClose} onClick={() => setCartOpen(false)}>✕</button>
            </div>
            <BillContent
              cart={cart}
              subtotal={subtotal}
              discount={discount}
              onDiscountChange={setDiscount}
              onQtyChange={handleQtyChange}
              onRemove={handleRemove}
              onClear={() => { handleClear(); }}
              onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
            />
          </div>
        </div>
      )}

      {/* ── Qty Modal ── */}
      {qtyModal && (
        <QtyModal
          product={qtyModal}
          onConfirm={(qty) => handleAddToCart(qtyModal, qty)}
          onClose={() => setQtyModal(null)}
        />
      )}

      {/* ── Checkout Modal ── */}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          total={subtotal}
          discount={discount}
          onDiscountChange={setDiscount}
          onPay={handlePay}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      {/* ── Receipt / Success ── */}
      {paidBill && (
        <div style={S.overlay} onClick={() => setPaidBill(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: "center", fontSize: 48, marginBottom: 8 }}>✅</div>
            <div style={S.receiptTitle}>Payment Received</div>
            <div style={S.receiptMethod}>{paidBill.method} · {fmt(paidBill.total)}</div>
            <div style={S.receiptTime}>{paidBill.time.toLocaleTimeString("en-IN")}</div>
            {paidBill.cart.map((i) => (
              <div key={i.product.id} style={S.receiptRow}>
                <span>{i.product.name} × {i.qty}</span>
                <span>{fmt(i.product.price * i.qty)}</span>
              </div>
            ))}
            <div style={{ ...S.receiptRow, fontWeight: 700, fontSize: 16, marginTop: 8, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
              <span>Total Paid</span>
              <span style={{ color: C.green }}>{fmt(paidBill.total)}</span>
            </div>
            <button style={S.confirmBtn} onClick={() => setPaidBill(null)}>New Bill</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bill content (shared desktop + drawer) ───────────────────────────────────
function BillContent({ cart, subtotal, discount, onDiscountChange, onQtyChange, onRemove, onClear, onCheckout }) {
  const discountAmt = subtotal * (discount / 100);
  const total = subtotal - discountAmt;

  return (
    <div style={S.billContent}>
      <div style={S.billTitle}>Current Bill</div>

      {cart.length === 0 ? (
        <div style={S.billEmpty}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
          <div>Tap a product to add it here</div>
        </div>
      ) : (
        <div style={S.cartList}>
          {cart.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onChange={onQtyChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}

      <div style={S.billSummary}>
        <div style={S.summaryRow}>
          <span>Subtotal</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div style={S.summaryRow}>
          <span>Discount</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => onDiscountChange(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
              style={S.discountInline}
            />
            <span style={{ color: C.textMuted, fontSize: 13 }}>%</span>
            <span style={{ color: C.red, fontSize: 13, fontWeight: 700 }}>−{fmt(discountAmt)}</span>
          </div>
        </div>
        <div style={{ ...S.summaryRow, fontSize: 20, fontWeight: 800, color: C.green, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
      </div>

      <div style={S.billActions}>
        <button style={S.clearBtn} onClick={onClear} disabled={cart.length === 0}>
          ✕ Clear
        </button>
        <button style={S.holdBtn} disabled>
          ⏸ Hold
        </button>
      </div>

      <button
        style={{ ...S.checkoutBtn, ...(cart.length === 0 ? S.checkoutBtnDisabled : {}) }}
        onClick={onCheckout}
        disabled={cart.length === 0}
      >
        Checkout {fmt(total)} →
      </button>
    </div>
  );
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:        "#0f1117",
  surface:   "#1a1d27",
  surfaceAlt:"#222636",
  border:    "#2a2d3e",
  green:     "#22c55e",
  greenDim:  "#16a34a",
  red:       "#ef4444",
  text:      "#e2e8f0",
  textMuted: "#94a3b8",
  accent:    "#3b82f6",
};

const S = {
  page: {
    background: C.bg,
    minHeight: "100vh",
    color: C.text,
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    display: "flex",
    flexDirection: "column",
    paddingBottom: "80px",
  },
  // Top bar
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: C.surface,
    borderBottom: `1px solid ${C.border}`,
  },
  topBarLeft:   { display: "flex", alignItems: "center", gap: 12 },
  topBarDate:   { fontSize: 13, color: C.textMuted },
  topBarStatus: { fontSize: 13, color: C.green, fontWeight: 600 },
  topBarRight:  {},
  customerBadge:{ fontSize: 13, color: C.textMuted },
  // Search + categories
  controlBar: {
    padding: "10px 12px 0",
    background: C.surface,
    borderBottom: `1px solid ${C.border}`,
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    background: C.surfaceAlt,
    borderRadius: 10,
    padding: "9px 12px",
    gap: 8,
    marginBottom: 10,
    border: `1px solid ${C.border}`,
  },
  searchIcon:  { fontSize: 15, flexShrink: 0 },
  searchInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    fontSize: 15,
    color: C.text,
    caretColor: C.green,
  },
  clearSearch: {
    background: "none",
    border: "none",
    color: C.textMuted,
    cursor: "pointer",
    fontSize: 14,
    padding: "2px 4px",
  },
  catBar: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 10,
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
  },
  catChip: {
    flexShrink: 0,
    padding: "7px 14px",
    borderRadius: 20,
    border: `1px solid ${C.border}`,
    background: C.surfaceAlt,
    color: C.textMuted,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  catChipActive: {
    background: C.green,
    color: "#000",
    border: `1px solid ${C.green}`,
  },
  // Main layout
  main: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    alignItems: "flex-start",
  },
  gridPanel: {
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    padding: "12px",
    boxSizing: "border-box",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
  },
  productCard: {
    background: C.surface,
    borderRadius: 12,
    padding: "12px 10px",
    cursor: "pointer",
    border: `1.5px solid ${C.border}`,
    position: "relative",
    transition: "border-color 0.15s",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
  },
  productCardOut: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  productCardInCart: {
    border: `1.5px solid ${C.green}`,
    background: "#0d1f16",
  },
  cartQtyBadge: {
    position: "absolute",
    top: 6,
    right: 8,
    background: C.green,
    color: "#000",
    borderRadius: "50%",
    width: 22,
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
  },
  productEmoji: { fontSize: 28, marginBottom: 4 },
  productName:  { fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2, lineHeight: 1.3 },
  productDesc:  { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: 800, color: C.green, marginBottom: 2 },
  stockBadge:   { fontSize: 11, fontWeight: 600 },
  noResults:    { color: C.textMuted, textAlign: "center", padding: "40px 20px", fontSize: 15 },
  // Bill panel (desktop)
  billPanel: {
    borderLeft: `1px solid ${C.border}`,
    background: C.surface,
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 120px)",
    position: "sticky",
    top: 0,
    overflowY: "auto",
  },
  billContent: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 0,
    flex: 1,
  },
  billTitle: { fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 12 },
  billEmpty: { color: C.textMuted, fontSize: 14, textAlign: "center", padding: "30px 0", flex: 1 },
  cartList:  { flex: 1, marginBottom: 8 },
  cartRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: `1px solid ${C.border}`,
  },
  cartRowLeft:    { display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 },
  cartEmoji:      { fontSize: 20, flexShrink: 0 },
  cartName:       { fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  cartMeta:       { fontSize: 12, color: C.textMuted, marginTop: 1 },
  cartRowRight:   { display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
  cartLineTotal:  { fontSize: 14, fontWeight: 700, color: C.green },
  cartRemove:     { background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "2px" },
  billSummary: {
    background: C.surfaceAlt,
    borderRadius: 10,
    padding: "12px 14px",
    marginTop: 8,
    marginBottom: 10,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
    color: C.text,
  },
  discountInline: {
    width: 48,
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    color: C.text,
    fontSize: 13,
    padding: "4px 6px",
    textAlign: "center",
    outline: "none",
  },
  billActions: { display: "flex", gap: 8, marginBottom: 8 },
  clearBtn: {
    flex: 1,
    padding: "11px",
    borderRadius: 10,
    border: `1.5px solid ${C.red}`,
    background: "transparent",
    color: C.red,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  holdBtn: {
    flex: 1,
    padding: "11px",
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    background: "transparent",
    color: C.textMuted,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  checkoutBtn: {
    width: "100%",
    padding: "15px",
    borderRadius: 12,
    border: "none",
    background: C.green,
    color: "#000",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: "0.3px",
  },
  checkoutBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  // Mobile cart bar (fixed bottom)
  mobileCartBar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "10px 12px 16px",
    background: C.surface,
    borderTop: `1px solid ${C.border}`,
    zIndex: 100,
  },
  mobileCartBtn: {
    width: "100%",
    background: C.green,
    border: "none",
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  },
  mobileCartIcon:  { fontSize: 20 },
  mobileCartLabel: { flex: 1, fontSize: 15, fontWeight: 700, color: "#000", textAlign: "left" },
  mobileCartArrow: { fontSize: 13, fontWeight: 700, color: "#000", opacity: 0.7 },
  mobileCartEmpty: { textAlign: "center", color: C.textMuted, fontSize: 13, padding: "6px 0" },
  // Mobile drawer
  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    zIndex: 200,
    display: "flex",
    alignItems: "flex-end",
  },
  drawer: {
    background: C.surface,
    borderRadius: "20px 20px 0 0",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    paddingBottom: 20,
    WebkitOverflowScrolling: "touch",
  },
  drawerHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: C.border,
    margin: "12px auto 0",
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px 8px",
    borderBottom: `1px solid ${C.border}`,
  },
  drawerTitle: { fontSize: 17, fontWeight: 700, color: C.text },
  drawerClose: {
    background: C.surfaceAlt,
    border: "none",
    borderRadius: "50%",
    width: 30,
    height: 30,
    cursor: "pointer",
    color: C.textMuted,
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  // Toast
  toast: {
    position: "fixed",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    background: C.green,
    color: "#000",
    padding: "10px 22px",
    borderRadius: 30,
    fontSize: 13,
    fontWeight: 700,
    zIndex: 999,
    boxShadow: "0 4px 16px rgba(34,197,94,0.4)",
    whiteSpace: "nowrap",
  },
  // Overlay + Modal
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    zIndex: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  modal: {
    background: C.surface,
    borderRadius: 18,
    padding: 20,
    width: "100%",
    maxWidth: 380,
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: `1px solid ${C.border}`,
  },
  modalEmoji: { fontSize: 36 },
  modalName:  { fontSize: 17, fontWeight: 700, color: C.text },
  modalMeta:  { fontSize: 13, color: C.textMuted, marginTop: 2 },
  // Qty modal
  qtyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    marginBottom: 16,
  },
  qtyChip: {
    padding: "12px 6px",
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    background: C.surfaceAlt,
    color: C.text,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  },
  qtyChipActive: {
    background: C.green,
    border: `1.5px solid ${C.green}`,
    color: "#000",
  },
  qtyInputRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  qtyStepBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    background: C.surfaceAlt,
    color: C.text,
    fontSize: 24,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  qtyManualInput: {
    flex: 1,
    textAlign: "center",
    fontSize: 26,
    fontWeight: 800,
    padding: "10px",
    borderRadius: 10,
    border: `2px solid ${C.green}`,
    background: "#0d1f16",
    color: C.green,
    outline: "none",
  },
  modalTotal: {
    textAlign: "center",
    fontSize: 15,
    color: C.textMuted,
    marginBottom: 16,
  },
  confirmBtn: {
    width: "100%",
    padding: 15,
    borderRadius: 12,
    border: "none",
    background: C.green,
    color: "#000",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 8,
  },
  cancelBtn: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    background: "transparent",
    color: C.textMuted,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  // Checkout
  checkoutTitle:   { fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 14, textAlign: "center" },
  checkoutItems:   { marginBottom: 12, maxHeight: 180, overflowY: "auto" },
  checkoutItemRow: { display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: C.textMuted, borderBottom: `1px solid ${C.border}` },
  checkoutItemName:{ flex: 1 },
  checkoutItemAmt: { fontWeight: 700, color: C.text },
  discountRow:     { display: "flex", alignItems: "center", gap: 8, marginBottom: 12 },
  discountLabel:   { fontSize: 13, color: C.textMuted, minWidth: 80 },
  discountInput: {
    width: 64,
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    color: C.text,
    fontSize: 14,
    padding: "7px 10px",
    textAlign: "center",
    outline: "none",
  },
  checkoutTotal: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderTop: `1px solid ${C.border}`,
    borderBottom: `1px solid ${C.border}`,
    marginBottom: 14,
    fontSize: 16,
    fontWeight: 700,
    color: C.text,
  },
  methodRow: { display: "flex", gap: 8, marginBottom: 14 },
  methodBtn: {
    flex: 1,
    padding: "11px 6px",
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    background: C.surfaceAlt,
    color: C.textMuted,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  methodBtnActive: {
    background: C.green,
    border: `1.5px solid ${C.green}`,
    color: "#000",
  },
  tenderedRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14 },
  payBtn: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    border: "none",
    background: C.green,
    color: "#000",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer",
    marginBottom: 8,
  },
  // Receipt
  receiptTitle:  { textAlign: "center", fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 },
  receiptMethod: { textAlign: "center", fontSize: 15, color: C.green, fontWeight: 700, marginBottom: 2 },
  receiptTime:   { textAlign: "center", fontSize: 12, color: C.textMuted, marginBottom: 14 },
  receiptRow:    { display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: C.textMuted },
};
