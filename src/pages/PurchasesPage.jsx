// src/pages/PurchasePage.jsx
// Mobile-optimised Purchase module for Egg Mart POS
// Drop-in replacement: add <Route path="/purchase" element={<PurchasePage />} /> in App.jsx

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Product Data (inline so the file is self-contained) ──────────────────────
const PRODUCTS = [
  // EGGS
  { id: 1,  name: "Farm Fresh Eggs (Tray 30)",     category: "Eggs",         unit: "Tray",   price: 180 },
  { id: 2,  name: "Farm Fresh Eggs (Pack 6)",      category: "Eggs",         unit: "Pack",   price: 38  },
  { id: 3,  name: "Farm Fresh Eggs (Pack 12)",     category: "Eggs",         unit: "Pack",   price: 72  },
  { id: 4,  name: "Country / Desi Eggs (Tray 30)", category: "Eggs",         unit: "Tray",   price: 270 },
  { id: 5,  name: "Country / Desi Eggs (Pack 6)",  category: "Eggs",         unit: "Pack",   price: 55  },
  { id: 6,  name: "Organic Free-Range Eggs (Doz)", category: "Eggs",         unit: "Dozen",  price: 120 },
  { id: 7,  name: "Brown Eggs (Tray 30)",           category: "Eggs",         unit: "Tray",   price: 210 },
  { id: 8,  name: "Brown Eggs (Pack 6)",            category: "Eggs",         unit: "Pack",   price: 44  },
  { id: 9,  name: "Omega-3 Enriched Eggs (Pack 6)",category: "Eggs",         unit: "Pack",   price: 65  },
  { id: 10, name: "Quail Eggs (Pack 20)",           category: "Eggs",         unit: "Pack",   price: 90  },
  { id: 11, name: "Duck Eggs (Pack 6)",             category: "Eggs",         unit: "Pack",   price: 80  },
  { id: 12, name: "Jumbo Eggs (Tray 30)",           category: "Eggs",         unit: "Tray",   price: 220 },
  { id: 13, name: "Medium Eggs (Tray 30)",          category: "Eggs",         unit: "Tray",   price: 165 },
  // EGG PRODUCTS
  { id: 14, name: "Boiled Eggs (Pack 6)",           category: "Egg Products", unit: "Pack",   price: 50  },
  { id: 15, name: "Pickled Eggs (Jar 12)",          category: "Egg Products", unit: "Jar",    price: 130 },
  { id: 16, name: "Liquid Whole Egg (1 Litre)",    category: "Egg Products", unit: "Litre",  price: 95  },
  { id: 17, name: "Egg White Liquid (500 ml)",     category: "Egg Products", unit: "Bottle", price: 80  },
  { id: 18, name: "Egg Yolk Liquid (500 ml)",      category: "Egg Products", unit: "Bottle", price: 75  },
  { id: 19, name: "Egg Powder (200 g)",             category: "Egg Products", unit: "Pack",   price: 160 },
  { id: 20, name: "Pasteurised Eggs (Dozen)",       category: "Egg Products", unit: "Dozen",  price: 130 },
  // DAIRY
  { id: 21, name: "Full Cream Milk (1 Litre)",     category: "Dairy",        unit: "Litre",  price: 68  },
  { id: 22, name: "Toned Milk (500 ml)",            category: "Dairy",        unit: "Pouch",  price: 30  },
  { id: 23, name: "Butter (500 g)",                 category: "Dairy",        unit: "Pack",   price: 240 },
  { id: 24, name: "Paneer (200 g)",                 category: "Dairy",        unit: "Pack",   price: 90  },
  { id: 25, name: "Curd / Yoghurt (400 g)",         category: "Dairy",        unit: "Cup",    price: 45  },
  { id: 26, name: "Cheese Slices (200 g)",          category: "Dairy",        unit: "Pack",   price: 120 },
  // FEED
  { id: 27, name: "Poultry Layer Feed (25 kg)",    category: "Feed",         unit: "Bag",    price: 950 },
  { id: 28, name: "Poultry Starter Feed (25 kg)",  category: "Feed",         unit: "Bag",    price: 900 },
  { id: 29, name: "Calcium Supplement (1 kg)",     category: "Feed",         unit: "Pack",   price: 110 },
  { id: 30, name: "Vitamin Premix (500 g)",         category: "Feed",         unit: "Pack",   price: 180 },
  // PACKAGING
  { id: 31, name: "Egg Carton (Pack of 50)",       category: "Packaging",    unit: "Pack",   price: 200 },
  { id: 32, name: "Egg Tray (Pack of 20)",         category: "Packaging",    unit: "Pack",   price: 150 },
  { id: 33, name: "Bubble Wrap Roll (50 m)",       category: "Packaging",    unit: "Roll",   price: 280 },
];

const CATEGORIES = ["All", "Eggs", "Egg Products", "Dairy", "Feed", "Packaging"];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={styles.toast}>
      <span style={styles.toastIcon}>✓</span>
      {message}
    </div>
  );
}

function ProductDropdown({ value, onChange, search, onSearchChange, open, onToggle, dropdownRef }) {
  const filtered = PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = CATEGORIES.slice(1).reduce((acc, cat) => {
    const items = filtered.filter((p) => p.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div style={styles.dropdownWrapper} ref={dropdownRef}>
      <div style={styles.dropdownTrigger} onClick={onToggle}>
        <div style={{ flex: 1 }}>
          {value ? (
            <>
              <div style={styles.selectedName}>{value.name}</div>
              <div style={styles.selectedMeta}>{value.category} · {value.unit} · {fmt(value.price)}</div>
            </>
          ) : (
            <span style={styles.placeholder}>🔍  Select a product…</span>
          )}
        </div>
        <span style={{ ...styles.chevron, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
      </div>

      {open && (
        <div style={styles.dropdownPanel}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              autoFocus
              style={styles.searchInput}
              placeholder="Search product or category…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {search && (
              <button style={styles.clearBtn} onClick={() => onSearchChange("")}>✕</button>
            )}
          </div>

          <div style={styles.dropdownList}>
            {Object.keys(grouped).length === 0 ? (
              <div style={styles.noResults}>No products found</div>
            ) : (
              Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div style={styles.categoryHeader}>{cat}</div>
                  {items.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        ...styles.dropdownItem,
                        ...(value?.id === p.id ? styles.dropdownItemActive : {}),
                      }}
                      onClick={() => {
                        onChange(p);
                        onToggle();
                        onSearchChange("");
                      }}
                    >
                      <div style={styles.itemName}>{p.name}</div>
                      <div style={styles.itemPrice}>{fmt(p.price)} / {p.unit}</div>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CartItem({ item, onQtyChange, onRemove }) {
  return (
    <div style={styles.cartItem}>
      <div style={styles.cartItemInfo}>
        <div style={styles.cartItemName}>{item.product.name}</div>
        <div style={styles.cartItemMeta}>{fmt(item.product.price)} × {item.qty} {item.product.unit}</div>
      </div>
      <div style={styles.cartItemActions}>
        <button style={styles.qtyBtn} onClick={() => onQtyChange(item.product.id, Math.max(1, item.qty - 1))}>−</button>
        <span style={styles.qtyDisplay}>{item.qty}</span>
        <button style={styles.qtyBtn} onClick={() => onQtyChange(item.product.id, item.qty + 1)}>+</button>
        <span style={styles.cartItemTotal}>{fmt(item.product.price * item.qty)}</span>
        <button style={styles.removeBtn} onClick={() => onRemove(item.product.id)}>🗑</button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchasePage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const qtyRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus qty input when product selected
  useEffect(() => {
    if (selectedProduct && qtyRef.current) {
      setTimeout(() => qtyRef.current?.focus(), 80);
    }
  }, [selectedProduct]);

  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setUnitPrice(product.price.toString());
    setQuantity("");
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedProduct || !quantity || Number(quantity) <= 0) return;
    const qty = Number(quantity);
    const price = Number(unitPrice) || selectedProduct.price;

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === selectedProduct.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === selectedProduct.id
            ? { ...i, qty: i.qty + qty, unitPrice: price }
            : i
        );
      }
      return [...prev, { product: { ...selectedProduct, price }, qty, unitPrice: price }];
    });

    setToast(`${selectedProduct.name} added!`);
    setCartOpen(false); // collapse cart so user can add next product fast
    setSelectedProduct(null);
    setQuantity("");
    setUnitPrice("");
    setTimeout(() => setDropdownOpen(true), 150); // re-open dropdown for next item
  }, [selectedProduct, quantity, unitPrice]);

  // Submit on Enter in qty field
  const handleQtyKeyDown = (e) => {
    if (e.key === "Enter") handleAddToCart();
  };

  const handleQtyChange = (id, newQty) => {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: newQty } : i)));
  };

  const handleRemove = (id) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const handleSubmitPurchase = async () => {
    if (!cart.length) return;
    setSubmitting(true);
    // Replace with real API call, e.g.:
    // await fetch("/api/purchases", { method: "POST", body: JSON.stringify({ supplier, invoiceNo, purchaseDate, items: cart }) });
    await new Promise((r) => setTimeout(r, 900)); // simulate API
    setSubmitting(false);
    setSubmitted(true);
    setCart([]);
    setSelectedProduct(null);
    setQuantity("");
    setUnitPrice("");
    setSupplier("");
    setInvoiceNo("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🛒 Purchase Entry</h1>
          <p style={styles.subtitle}>Add items from supplier</p>
        </div>
        {cart.length > 0 && (
          <button style={styles.cartToggleBtn} onClick={() => setCartOpen((o) => !o)}>
            🛍 Cart
            <span style={styles.cartBadge}>{cartCount}</span>
          </button>
        )}
      </div>

      {/* ── Toast notification ── */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* ── Success banner ── */}
      {submitted && (
        <div style={styles.successBanner}>
          ✅ Purchase submitted successfully!
        </div>
      )}

      {/* ── Purchase Meta ── */}
      <div style={styles.card}>
        <div style={styles.metaGrid}>
          <div style={styles.field}>
            <label style={styles.label}>Supplier</label>
            <input
              style={styles.input}
              placeholder="Supplier name"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Invoice No.</label>
            <input
              style={styles.input}
              placeholder="e.g. INV-001"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Date</label>
            <input
              style={styles.input}
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Product Selector ── */}
      <div style={styles.card}>
        <label style={styles.sectionLabel}>Step 1 — Select Product</label>
        <ProductDropdown
          value={selectedProduct}
          onChange={handleProductSelect}
          search={search}
          onSearchChange={setSearch}
          open={dropdownOpen}
          onToggle={() => setDropdownOpen((o) => !o)}
          dropdownRef={dropdownRef}
        />

        {selectedProduct && (
          <div style={styles.addRow}>
            <div style={styles.qtyGroup}>
              <label style={styles.label}>Step 2 — Quantity ({selectedProduct.unit})</label>
              <input
                ref={qtyRef}
                style={styles.qtyInput}
                type="number"
                inputMode="numeric"
                min="1"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyDown={handleQtyKeyDown}
              />
            </div>
            <div style={styles.priceGroup}>
              <label style={styles.label}>Unit Price (₹)</label>
              <input
                style={styles.qtyInput}
                type="number"
                inputMode="decimal"
                min="0"
                placeholder={selectedProduct.price}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
            <button
              style={{
                ...styles.addBtn,
                ...((!quantity || Number(quantity) <= 0) ? styles.addBtnDisabled : {}),
              }}
              onClick={handleAddToCart}
              disabled={!quantity || Number(quantity) <= 0}
            >
              + Add to Cart
            </button>
          </div>
        )}

        {selectedProduct && quantity && Number(quantity) > 0 && (
          <div style={styles.previewBadge}>
            Preview: {quantity} × {fmt(Number(unitPrice) || selectedProduct.price)} = {fmt((Number(unitPrice) || selectedProduct.price) * Number(quantity))}
          </div>
        )}
      </div>

      {/* ── Collapsible Cart ── */}
      {cart.length > 0 && (
        <div style={styles.cartCard}>
          <button style={styles.cartHeader} onClick={() => setCartOpen((o) => !o)}>
            <div style={styles.cartHeaderLeft}>
              <span style={styles.cartIcon}>🛍</span>
              <span style={styles.cartTitle}>Cart ({cart.length} line{cart.length !== 1 ? "s" : ""})</span>
            </div>
            <div style={styles.cartHeaderRight}>
              <span style={styles.cartTotal}>{fmt(cartTotal)}</span>
              <span style={{ ...styles.chevron, transform: cartOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </div>
          </button>

          <div style={{
            ...styles.cartBody,
            maxHeight: cartOpen ? "600px" : "0px",
            opacity: cartOpen ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
          }}>
            <div style={styles.cartList}>
              {cart.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onQtyChange={handleQtyChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            <div style={styles.cartSummary}>
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{fmt(cartTotal)}</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Items</span>
                <span>{cartCount} units across {cart.length} lines</span>
              </div>
            </div>

            <button
              style={{
                ...styles.submitBtn,
                ...(submitting ? styles.submitBtnLoading : {}),
              }}
              onClick={handleSubmitPurchase}
              disabled={submitting}
            >
              {submitting ? "⏳ Submitting…" : `✅ Submit Purchase · ${fmt(cartTotal)}`}
            </button>

            <button
              style={styles.clearCartBtn}
              onClick={() => { if (window.confirm("Clear entire cart?")) setCart([]); }}
            >
              🗑 Clear Cart
            </button>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {cart.length === 0 && !selectedProduct && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🥚</div>
          <p style={styles.emptyText}>Select a product above to start building your purchase order.</p>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const COLOR = {
  bg: "#f5f6fa",
  card: "#ffffff",
  primary: "#e67e22",
  primaryDark: "#d35400",
  primaryLight: "#fdf3eb",
  success: "#27ae60",
  danger: "#e74c3c",
  text: "#2c3e50",
  muted: "#7f8c8d",
  border: "#e8ecef",
  shadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const styles = {
  page: {
    background: COLOR.bg,
    minHeight: "100vh",
    padding: "12px",
    maxWidth: "540px",
    margin: "0 auto",
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  title: { margin: 0, fontSize: "22px", fontWeight: 700, color: COLOR.text },
  subtitle: { margin: "2px 0 0", fontSize: "13px", color: COLOR.muted },
  cartToggleBtn: {
    background: COLOR.primary,
    color: "#fff",
    border: "none",
    borderRadius: "24px",
    padding: "10px 18px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 2px 8px rgba(230,126,34,0.35)",
  },
  cartBadge: {
    background: "#fff",
    color: COLOR.primary,
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
  },
  toast: {
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    background: COLOR.success,
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "32px",
    fontSize: "14px",
    fontWeight: 600,
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 4px 20px rgba(39,174,96,0.4)",
    animation: "fadeIn 0.2s ease",
  },
  toastIcon: { fontSize: "18px" },
  successBanner: {
    background: "#eafaf1",
    border: `1px solid ${COLOR.success}`,
    borderRadius: "10px",
    padding: "12px 16px",
    color: COLOR.success,
    fontWeight: 600,
    marginBottom: "12px",
    fontSize: "14px",
  },
  card: {
    background: COLOR.card,
    borderRadius: "14px",
    padding: "16px",
    marginBottom: "12px",
    boxShadow: COLOR.shadow,
  },
  cartCard: {
    background: COLOR.card,
    borderRadius: "14px",
    marginBottom: "12px",
    boxShadow: COLOR.shadow,
    overflow: "hidden",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  field: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "12px", fontWeight: 600, color: COLOR.muted, textTransform: "uppercase", letterSpacing: "0.5px" },
  sectionLabel: {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: COLOR.muted,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "10px",
  },
  input: {
    border: `1.5px solid ${COLOR.border}`,
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "14px",
    color: COLOR.text,
    background: "#fafafa",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  // Dropdown
  dropdownWrapper: { position: "relative" },
  dropdownTrigger: {
    display: "flex",
    alignItems: "center",
    border: `1.5px solid ${COLOR.border}`,
    borderRadius: "10px",
    padding: "12px 14px",
    cursor: "pointer",
    background: "#fafafa",
    minHeight: "56px",
    gap: "8px",
    userSelect: "none",
  },
  selectedName: { fontSize: "15px", fontWeight: 600, color: COLOR.text },
  selectedMeta: { fontSize: "12px", color: COLOR.muted, marginTop: "2px" },
  placeholder: { color: COLOR.muted, fontSize: "15px" },
  chevron: {
    fontSize: "18px",
    color: COLOR.muted,
    transition: "transform 0.2s ease",
    lineHeight: 1,
    flexShrink: 0,
  },
  dropdownPanel: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    zIndex: 200,
    overflow: "hidden",
    border: `1px solid ${COLOR.border}`,
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    borderBottom: `1px solid ${COLOR.border}`,
    gap: "8px",
  },
  searchIcon: { fontSize: "16px", flexShrink: 0 },
  searchInput: {
    flex: 1,
    border: "none",
    outline: "none",
    fontSize: "15px",
    color: COLOR.text,
    background: "transparent",
  },
  clearBtn: {
    border: "none",
    background: "none",
    cursor: "pointer",
    color: COLOR.muted,
    fontSize: "14px",
    padding: "2px 4px",
  },
  dropdownList: {
    maxHeight: "340px",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },
  categoryHeader: {
    padding: "8px 14px 4px",
    fontSize: "11px",
    fontWeight: 700,
    color: COLOR.primary,
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    background: COLOR.primaryLight,
    borderTop: `1px solid ${COLOR.border}`,
  },
  dropdownItem: {
    padding: "12px 14px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: `1px solid ${COLOR.border}`,
    transition: "background 0.1s",
  },
  dropdownItemActive: {
    background: COLOR.primaryLight,
  },
  itemName: { fontSize: "14px", color: COLOR.text, fontWeight: 500 },
  itemPrice: { fontSize: "13px", color: COLOR.primary, fontWeight: 600, whiteSpace: "nowrap", marginLeft: "8px" },
  noResults: { padding: "24px", textAlign: "center", color: COLOR.muted, fontSize: "14px" },
  // Add row
  addRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginTop: "14px",
    alignItems: "end",
  },
  qtyGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  priceGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  qtyInput: {
    border: `2px solid ${COLOR.primary}`,
    borderRadius: "10px",
    padding: "13px 14px",
    fontSize: "20px",
    fontWeight: 700,
    color: COLOR.text,
    outline: "none",
    textAlign: "center",
    width: "100%",
    boxSizing: "border-box",
    background: COLOR.primaryLight,
  },
  addBtn: {
    gridColumn: "1 / -1",
    background: COLOR.primary,
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "15px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 3px 12px rgba(230,126,34,0.4)",
    transition: "transform 0.1s, box-shadow 0.1s",
    letterSpacing: "0.3px",
  },
  addBtnDisabled: {
    background: "#bdc3c7",
    boxShadow: "none",
    cursor: "not-allowed",
  },
  previewBadge: {
    marginTop: "10px",
    background: "#eafaf1",
    border: "1px solid #82e0aa",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "13px",
    color: COLOR.success,
    fontWeight: 600,
    textAlign: "center",
  },
  // Cart
  cartHeader: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
  },
  cartHeaderLeft: { display: "flex", alignItems: "center", gap: "10px" },
  cartIcon: { fontSize: "20px" },
  cartTitle: { fontSize: "16px", fontWeight: 700, color: COLOR.text },
  cartHeaderRight: { display: "flex", alignItems: "center", gap: "10px" },
  cartTotal: { fontSize: "16px", fontWeight: 700, color: COLOR.primary },
  cartBody: { padding: "0 16px 0" },
  cartList: { paddingBottom: "8px" },
  cartItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: `1px solid ${COLOR.border}`,
    gap: "8px",
    flexWrap: "wrap",
  },
  cartItemInfo: { flex: 1, minWidth: 0 },
  cartItemName: { fontSize: "13px", fontWeight: 600, color: COLOR.text, wordBreak: "break-word" },
  cartItemMeta: { fontSize: "12px", color: COLOR.muted, marginTop: "2px" },
  cartItemActions: { display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 },
  qtyBtn: {
    width: "30px",
    height: "30px",
    border: `1.5px solid ${COLOR.border}`,
    borderRadius: "8px",
    background: "#fafafa",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    color: COLOR.text,
    flexShrink: 0,
  },
  qtyDisplay: { fontSize: "15px", fontWeight: 700, color: COLOR.text, minWidth: "24px", textAlign: "center" },
  cartItemTotal: { fontSize: "13px", fontWeight: 700, color: COLOR.primary, minWidth: "52px", textAlign: "right" },
  removeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "2px",
    flexShrink: 0,
  },
  cartSummary: {
    background: "#fafafa",
    borderRadius: "10px",
    padding: "12px 14px",
    margin: "8px 0",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    color: COLOR.muted,
    padding: "3px 0",
  },
  submitBtn: {
    width: "100%",
    background: COLOR.success,
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "16px",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 3px 12px rgba(39,174,96,0.35)",
    marginBottom: "8px",
    letterSpacing: "0.3px",
  },
  submitBtnLoading: { opacity: 0.7, cursor: "wait" },
  clearCartBtn: {
    width: "100%",
    background: "none",
    border: `1.5px solid ${COLOR.danger}`,
    borderRadius: "10px",
    padding: "11px",
    fontSize: "14px",
    fontWeight: 600,
    color: COLOR.danger,
    cursor: "pointer",
    marginBottom: "16px",
  },
  // Empty state
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: COLOR.muted,
  },
  emptyIcon: { fontSize: "52px", marginBottom: "12px" },
  emptyText: { fontSize: "15px", lineHeight: 1.5, maxWidth: "260px", margin: "0 auto" },
};
