// src/pages/PurchasesPage.jsx
// Admin Purchase module for Egg Mart POS — product selection sources the
// real inventory (useApp().products) and "Submit Purchase" actually
// persists to the backend via addPurchase(), with a Purchase History
// section showing everything that's been saved.

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import * as XLSX from "xlsx";
import { useApp } from "../App";
import { getPurchases, getPurchase } from "../api";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(n) || 0);

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ message, type = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div style={{ ...styles.toast, background: type === "error" ? "var(--red)" : "var(--green)" }}>
      <span style={styles.toastIcon}>{type === "error" ? "✕" : "✓"}</span>
      {message}
    </div>
  );
}

function ProductDropdown({ value, onChange, search, onSearchChange, open, onToggle, dropdownRef, products }) {
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category || "Other"));
    return ["All", ...Array.from(set)];
  }, [products]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const grouped = categories.slice(1).reduce((acc, cat) => {
    const items = filtered.filter((p) => (p.category || "Other") === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div style={styles.dropdownWrapper} ref={dropdownRef}>
      <div style={styles.dropdownTrigger} onClick={onToggle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {value ? (
            <>
              <div style={styles.selectedName}>{value.emoji ? `${value.emoji} ` : ""}{value.name}</div>
              <div style={styles.selectedMeta}>{value.pack || value.category} · {fmt(value.price)} · Stock: {value.stock ?? "—"}</div>
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
                      <div style={styles.itemName}>{p.emoji ? `${p.emoji} ` : ""}{p.name}</div>
                      <div style={styles.itemPrice}>{fmt(p.price)} / {p.pack || "unit"}</div>
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
        <div style={styles.cartItemName}>{item.product.emoji ? `${item.product.emoji} ` : ""}{item.product.name}</div>
        <div style={styles.cartItemMeta}>{fmt(item.unitPrice)} × {item.qty} {item.product.pack || ""}</div>
      </div>
      <div style={styles.cartItemActions}>
        <button style={styles.qtyBtn} onClick={() => onQtyChange(item.product.id, Math.max(1, item.qty - 1))}>−</button>
        <span style={styles.qtyDisplay}>{item.qty}</span>
        <button style={styles.qtyBtn} onClick={() => onQtyChange(item.product.id, item.qty + 1)}>+</button>
        <span style={styles.cartItemTotal}>{fmt(item.unitPrice * item.qty)}</span>
        <button style={styles.removeBtn} onClick={() => onRemove(item.product.id)}>🗑</button>
      </div>
    </div>
  );
}

function HistoryRow({ purchase, expanded, onToggle, onView }) {
  return (
    <div style={styles.historyRow}>
      <div style={styles.historyRowMain} onClick={onToggle}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.historyInvoice}>
            {purchase.invoice_no || `Purchase #${purchase.id}`}
            {purchase.status && (
              <span style={{
                ...styles.statusBadge,
                background: purchase.status === 'cancelled' ? 'rgba(220,38,38,0.15)' : 'var(--green-dim)',
                color: purchase.status === 'cancelled' ? 'var(--red)' : 'var(--green)',
              }}>{purchase.status}</span>
            )}
          </div>
          <div style={styles.historyMeta}>
            {purchase.supplier || "Unknown supplier"} · {fmtDate(purchase.purchase_date || purchase.created_at)}
            {purchase.created_by_name ? ` · by ${purchase.created_by_name}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={styles.historyTotal}>{fmt(purchase.subtotal)}</div>
          <div style={styles.historyItemCount}>{purchase.item_count ?? purchase.items?.length ?? 0} item(s)</div>
        </div>
        <button
          style={styles.viewBtn}
          onClick={(e) => { e.stopPropagation(); onView(purchase); }}
        >
          View
        </button>
        <span style={{ ...styles.chevron, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", marginLeft: 8 }}>▾</span>
      </div>

      {expanded && purchase.items && (
        <div style={styles.historyItemsList}>
          {purchase.items.map((it) => (
            <div key={it.id} style={styles.historyItemRow}>
              <span>{it.name}{it.pack ? ` (${it.pack})` : ""}</span>
              <span style={{ color: "var(--muted)" }}>{fmt(it.unit_price)} × {Number(it.qty)}</span>
              <span style={{ fontWeight: 600 }}>{fmt(it.total)}</span>
            </div>
          ))}
          {purchase.notes && <div style={styles.historyNotes}>📝 {purchase.notes}</div>}
        </div>
      )}
    </div>
  );
}

// Full bill detail modal — Bill Number, Date, Supplier, Invoice Number,
// Purchased Products, Quantity, Purchase Price, Total Amount, and GST.
function PurchaseDetailModal({ purchase, onClose }) {
  if (!purchase) return null;
  const gstAmt = Number(purchase.gst_amt || 0);
  const grandTotal = Number(purchase.subtotal || 0) + gstAmt;
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalTitle}>Purchase Bill #{purchase.id}</div>
          <button style={styles.modalCloseBtn} onClick={onClose}>✕</button>
        </div>
        <div style={styles.modalMetaGrid}>
          <div><span style={styles.label}>Bill Number</span><div>{purchase.id}</div></div>
          <div><span style={styles.label}>Date</span><div>{fmtDate(purchase.purchase_date || purchase.created_at)}</div></div>
          <div><span style={styles.label}>Supplier</span><div>{purchase.supplier || "—"}</div></div>
          <div><span style={styles.label}>Invoice Number</span><div>{purchase.invoice_no || "—"}</div></div>
        </div>

        <div style={styles.historyItemsList}>
          {(purchase.items || []).map((it) => (
            <div key={it.id} style={styles.historyItemRow}>
              <span>{it.name}{it.pack ? ` (${it.pack})` : ""}</span>
              <span style={{ color: "var(--muted)" }}>{fmt(it.unit_price)} × {Number(it.qty)}</span>
              <span style={{ fontWeight: 600 }}>{fmt(it.total)}</span>
            </div>
          ))}
        </div>

        <div style={styles.modalTotalsBox}>
          <div style={styles.modalTotalRow}><span>Subtotal</span><span>{fmt(purchase.subtotal)}</span></div>
          <div style={styles.modalTotalRow}><span>GST ({Number(purchase.gst_pct || 0)}%)</span><span>{fmt(gstAmt)}</span></div>
          <div style={{ ...styles.modalTotalRow, fontWeight: 700, color: "var(--green)" }}><span>Grand Total</span><span>{fmt(grandTotal)}</span></div>
        </div>

        {purchase.notes && <div style={styles.historyNotes}>📝 {purchase.notes}</div>}
      </div>
    </div>
  );
}

// Builds a genuine .xlsx workbook (not a renamed CSV) with one row per
// purchased item, per the required export columns: Bill Number, Date,
// Supplier, Product Name, Quantity, Purchase Price, GST, Total, Grand Total.
function exportPurchasesToExcel(purchases) {
  const header = ["Bill Number", "Date", "Supplier", "Product Name", "Quantity", "Purchase Price", "GST", "Total", "Grand Total"];
  const rows = [header];

  for (const p of purchases) {
    const gstAmt = Number(p.gst_amt || 0);
    const grandTotal = Number(p.subtotal || 0) + gstAmt;
    const items = p.items && p.items.length ? p.items : [{ name: "(no items loaded)", qty: "", unit_price: "", total: "" }];
    items.forEach((it, idx) => {
      rows.push([
        p.invoice_no || `#${p.id}`,
        fmtDate(p.purchase_date || p.created_at),
        p.supplier || "",
        it.name || "",
        it.qty != null ? Number(it.qty) : "",
        it.unit_price != null ? Number(it.unit_price) : "",
        idx === 0 ? Number(gstAmt.toFixed(2)) : "",
        it.total != null ? Number(it.total) : "",
        idx === 0 ? Number(grandTotal.toFixed(2)) : "",
      ]);
    });
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  // Reasonable column widths so the exported file is readable without the
  // user having to manually resize every column on open.
  worksheet["!cols"] = [
    { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 24 },
    { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase History");
  XLSX.writeFile(workbook, `purchase-history-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchasesPage() {
  const { products, addPurchase } = useApp();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(true);
  // Root-cause fix for the Submit Purchase button being invisible: the cart
  // body's expand animation used a hardcoded `maxHeight: 600px`. Once the
  // cart list + summary + buttons together exceeded 600px (easily happens
  // with more than a handful of line items — very common on a small mobile
  // screen where each row wraps taller), the surrounding `overflow: hidden`
  // silently clipped everything past that point, including the Submit
  // Purchase button, even though it was still present in the DOM. Measuring
  // the actual content height and using that (with no hard cap) means the
  // button is never clipped, regardless of how many items are in the cart.
  const cartBodyRef = useRef(null);
  const [cartBodyHeight, setCartBodyHeight] = useState(0);
  const [toast, setToast] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [gstPct, setGstPct] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showHistory, setShowHistory] = useState(true);
  const [viewPurchase, setViewPurchase] = useState(null);
  const [exporting, setExporting] = useState(false);

  const qtyRef = useRef(null);
  const dropdownRef = useRef(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await getPurchases({ limit: 100 });
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load purchase history:", err);
      setHistoryError("Couldn't load purchase history. Check your connection and try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

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

  useEffect(() => {
    if (selectedProduct && qtyRef.current) {
      setTimeout(() => qtyRef.current?.focus(), 80);
    }
  }, [selectedProduct]);

  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setUnitPrice(String(product.price));
    setQuantity("");
  }, []);

  // Re-measure whenever the cart contents change or the panel opens, so the
  // expand animation always targets the real content height.
  useEffect(() => {
    if (cartBodyRef.current) {
      setCartBodyHeight(cartBodyRef.current.scrollHeight);
    }
  }, [cart, cartOpen]);

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
      return [...prev, { product: selectedProduct, qty, unitPrice: price }];
    });

    setToast({ message: `${selectedProduct.name} added!`, type: "success" });
    // Bug fix: this used to call setCartOpen(false), collapsing the cart
    // panel (and hiding the Submit Purchase button inside it) every single
    // time an item was added — so there was effectively no visible way to
    // submit a purchase. Auto-expand instead so the cart and its submit
    // button are visible right after adding.
    setCartOpen(true);
    setSelectedProduct(null);
    setQuantity("");
    setUnitPrice("");
    setTimeout(() => setDropdownOpen(true), 150);
  }, [selectedProduct, quantity, unitPrice]);

  const handleQtyKeyDown = (e) => {
    if (e.key === "Enter") handleAddToCart();
  };

  const handleQtyChange = (id, newQty) => {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: newQty } : i)));
  };

  const handleRemove = (id) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  // Fetches full line-item detail for a purchase if it isn't already loaded,
  // caching the result back into `history`. Previously this fetch used
  // `localStorage.getItem("token")` directly, but the app actually stores the
  // auth token under the key "egg-mart:token" (see api.js), so this request
  // always went out with an empty Authorization header and silently failed
  // — expanding a row, viewing a bill, or exporting never showed line items.
  const ensureItems = useCallback(async (purchase) => {
    if (purchase.items) return purchase;
    try {
      const full = await getPurchase(purchase.id);
      setHistory((prev) => prev.map((row) => (row.id === purchase.id ? { ...row, items: full.items } : row)));
      return { ...purchase, items: full.items };
    } catch (err) {
      console.error("Failed to load purchase detail:", err);
      return purchase;
    }
  }, []);

  const handleView = useCallback(async (purchase) => {
    setViewPurchase(purchase); // show immediately with what we have
    const full = await ensureItems(purchase);
    setViewPurchase(full);
  }, [ensureItems]);

  const handleExport = useCallback(async () => {
    if (!history.length) return;
    setExporting(true);
    try {
      // Make sure every row has its line items loaded before exporting.
      const full = await Promise.all(history.map((p) => ensureItems(p)));
      exportPurchasesToExcel(full);
    } catch (err) {
      console.error("Export failed:", err);
      setToast({ message: "Couldn't export purchase history.", type: "error" });
    } finally {
      setExporting(false);
    }
  }, [history, ensureItems]);

  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const handleSubmitPurchase = async () => {
    if (!cart.length || submitting) return;
    setSubmitting(true);

    const result = await addPurchase({
      invoiceNo,
      supplier,
      purchaseDate,
      gstPct: Number(gstPct) || 0,
      items: cart.map((i) => ({
        productId:  i.product.id,
        name:       i.product.name,
        pack:       i.product.pack,
        unitPrice:  i.unitPrice,
        qty:        i.qty,
      })),
    });

    setSubmitting(false);

    if (result) {
      setCart([]);
      setSelectedProduct(null);
      setQuantity("");
      setUnitPrice("");
      setSupplier("");
      setInvoiceNo("");
      setGstPct("");
      loadHistory();
    } else {
      setToast({ message: "Couldn't save purchase — please try again.", type: "error" });
    }
  };

  const stats = useMemo(() => {
    const total = history.reduce((s, p) => s + Number(p.subtotal || 0), 0);
    const thisMonth = history.filter((p) => {
      const d = new Date(p.purchase_date || p.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      count: history.length,
      total,
      monthCount: thisMonth.length,
      monthTotal: thisMonth.reduce((s, p) => s + Number(p.subtotal || 0), 0),
    };
  }, [history]);

  return (
    <div style={styles.page}>
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

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

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
          <div style={styles.field}>
            <label style={styles.label}>GST % (optional)</label>
            <input
              style={styles.input}
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="0"
              value={gstPct}
              onChange={(e) => setGstPct(e.target.value)}
            />
          </div>
        </div>
      </div>

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
          products={products}
        />

        {selectedProduct && (
          <div style={styles.addRow}>
            <div style={styles.qtyGroup}>
              <label style={styles.label}>Step 2 — Quantity {selectedProduct.pack ? `(${selectedProduct.pack})` : ""}</label>
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

          <div
            ref={cartBodyRef}
            style={{
              ...styles.cartBody,
              maxHeight: cartOpen ? `${cartBodyHeight || 2000}px` : "0px",
              opacity: cartOpen ? 1 : 0,
              overflow: "hidden",
              transition: "max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
            }}
          >
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

      {cart.length === 0 && !selectedProduct && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🥚</div>
          <p style={styles.emptyText}>Select a product above to start building your purchase order.</p>
        </div>
      )}

      <div style={styles.card}>
        <div style={styles.historyTopRow}>
          <button style={styles.historyHeaderBtn} onClick={() => setShowHistory((s) => !s)}>
            <label style={{ ...styles.sectionLabel, margin: 0 }}>📜 Purchase History</label>
            <span style={{ ...styles.chevron, transform: showHistory ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
          </button>
          {/* Admin-only — this whole page is already hidden from Cashier
              accounts (see Sidebar.jsx CASHIER_NAV), so no separate check
              is needed here. */}
          <button
            style={styles.exportBtn}
            onClick={handleExport}
            disabled={exporting || historyLoading || !history.length}
          >
            {exporting ? "Exporting…" : "⬇ Export to Excel"}
          </button>
        </div>

        {showHistory && (
          <>
            <div className="purchases-stats-grid" style={styles.statsGrid}>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Purchases</div>
                <div style={styles.statValue}>{stats.count}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>Total Spend</div>
                <div style={styles.statValue}>{fmt(stats.total)}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>This Month</div>
                <div style={styles.statValue}>{stats.monthCount}</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statLabel}>This Month Spend</div>
                <div style={styles.statValue}>{fmt(stats.monthTotal)}</div>
              </div>
            </div>

            {historyLoading ? (
              <div style={styles.historyEmpty}>Loading purchase history…</div>
            ) : historyError ? (
              <div style={styles.historyErrorBox}>
                ⚠️ {historyError}
                <button style={styles.retryBtn} onClick={loadHistory}>Retry</button>
              </div>
            ) : history.length === 0 ? (
              <div style={styles.historyEmpty}>No purchases recorded yet. Submit your first purchase above.</div>
            ) : (
              <div style={styles.historyList}>
                {history.map((p) => (
                  <HistoryRow
                    key={p.id}
                    purchase={p}
                    expanded={expandedId === p.id}
                    onView={handleView}
                    onToggle={async () => {
                      if (expandedId === p.id) {
                        setExpandedId(null);
                        return;
                      }
                      setExpandedId(p.id);
                      await ensureItems(p);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <PurchaseDetailModal purchase={viewPurchase} onClose={() => setViewPurchase(null)} />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Dark theme tokens (var(--*)) to match the rest of the admin app, instead of
// the standalone light theme this page previously used in isolation.

const styles = {
  page: {
    flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch",
    padding: 16, paddingBottom: 40, maxWidth: 720, margin: "0 auto",
    display: "flex", flexDirection: "column", gap: 14,
  },

  header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  title: { fontSize: 20, fontWeight: 700, margin: 0, color: "var(--text)" },
  subtitle: { fontSize: 13, color: "var(--muted)", margin: "2px 0 0" },

  cartToggleBtn: {
    display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 10,
    background: "var(--green)", color: "#0a1a0a", border: "none", fontWeight: 600, fontSize: 13,
    cursor: "pointer", minHeight: 40,
  },
  cartBadge: { background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "1px 7px", fontSize: 12 },

  card: { background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, padding: 16 },

  metaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  label: { fontSize: 11, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 },
  input: {
    padding: "12px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)",
    color: "var(--text)", fontSize: 14, outline: "none", minHeight: 44,
  },

  sectionLabel: { display: "block", fontSize: 12, fontWeight: 700, color: "var(--text2)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 },

  dropdownWrapper: { position: "relative" },
  dropdownTrigger: {
    display: "flex", alignItems: "center", gap: 10, padding: "14px 14px", borderRadius: 10,
    border: "1.5px solid var(--border)", background: "var(--bg2)", cursor: "pointer", minHeight: 56,
  },
  selectedName: { fontSize: 14, fontWeight: 600, color: "var(--text)" },
  selectedMeta: { fontSize: 12, color: "var(--muted)", marginTop: 2 },
  placeholder: { fontSize: 14, color: "var(--muted)" },
  chevron: { fontSize: 14, color: "var(--muted)", transition: "transform 0.2s ease", flexShrink: 0 },

  dropdownPanel: {
    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 30,
    background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 12,
    boxShadow: "0 12px 32px rgba(0,0,0,0.4)", maxHeight: 360, display: "flex", flexDirection: "column", overflow: "hidden",
  },
  searchBox: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0 },
  searchIcon: { fontSize: 14, opacity: 0.6 },
  searchInput: { flex: 1, border: "none", background: "transparent", color: "var(--text)", fontSize: 14, outline: "none" },
  clearBtn: { border: "none", background: "var(--bg3)", color: "var(--muted)", borderRadius: 6, width: 24, height: 24, cursor: "pointer" },
  dropdownList: { overflowY: "auto", padding: "4px 0" },
  noResults: { padding: "24px 12px", textAlign: "center", color: "var(--muted)", fontSize: 13 },
  categoryHeader: { fontSize: 11, fontWeight: 700, color: "var(--green)", padding: "8px 14px 4px", textTransform: "uppercase", letterSpacing: 0.4 },
  dropdownItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", cursor: "pointer", gap: 10, minHeight: 44 },
  dropdownItemActive: { background: "var(--green-dim)" },
  itemName: { fontSize: 13.5, color: "var(--text)", flex: 1 },
  itemPrice: { fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" },

  addRow: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14, alignItems: "flex-end" },
  qtyGroup: { display: "flex", flexDirection: "column", gap: 4, flex: "1 1 120px" },
  priceGroup: { display: "flex", flexDirection: "column", gap: 4, flex: "1 1 120px" },
  qtyInput: {
    padding: "13px 12px", borderRadius: 8, border: "1.5px solid var(--green)", background: "var(--bg2)",
    color: "var(--text)", fontSize: 16, fontWeight: 600, outline: "none", minHeight: 48,
  },
  addBtn: {
    padding: "13px 20px", borderRadius: 8, border: "none", background: "var(--green)", color: "#0a1a0a",
    fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 48, flex: "1 1 140px",
  },
  addBtnDisabled: { background: "var(--bg3)", color: "var(--muted)", cursor: "default" },

  previewBadge: { marginTop: 10, fontSize: 12.5, color: "var(--green)", background: "var(--green-dim)", padding: "8px 12px", borderRadius: 8 },

  cartCard: { background: "var(--bg1)", border: "1px solid var(--green)", borderRadius: 14, overflow: "hidden" },
  cartHeader: {
    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14,
    background: "var(--green-dim)", border: "none", cursor: "pointer", minHeight: 52,
  },
  cartHeaderLeft: { display: "flex", alignItems: "center", gap: 8 },
  cartIcon: { fontSize: 16 },
  cartTitle: { fontSize: 14, fontWeight: 600, color: "var(--text)" },
  cartHeaderRight: { display: "flex", alignItems: "center", gap: 10 },
  cartTotal: { fontSize: 14, fontWeight: 700, color: "var(--green)" },

  cartBody: { padding: "0 14px" },
  cartList: { display: "flex", flexDirection: "column", gap: 8, paddingTop: 12 },
  cartItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 10, flexWrap: "wrap" },
  cartItemInfo: { flex: "1 1 140px" },
  cartItemName: { fontSize: 13.5, fontWeight: 500, color: "var(--text)" },
  cartItemMeta: { fontSize: 12, color: "var(--muted)", marginTop: 2 },
  cartItemActions: { display: "flex", alignItems: "center", gap: 8 },
  qtyBtn: { width: 32, height: 32, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", fontSize: 16, cursor: "pointer" },
  qtyDisplay: { minWidth: 28, textAlign: "center", fontSize: 13, fontWeight: 600 },
  cartItemTotal: { fontSize: 13, fontWeight: 700, minWidth: 70, textAlign: "right" },
  removeBtn: { border: "none", background: "none", color: "var(--red)", cursor: "pointer", fontSize: 14, padding: 8 },

  cartSummary: { padding: "12px 0", borderTop: "1px solid var(--border)", marginTop: 8, display: "flex", flexDirection: "column", gap: 4 },
  summaryRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text2)" },

  submitBtn: {
    width: "100%", padding: 15, borderRadius: 10, border: "none", background: "var(--green)", color: "#0a1a0a",
    fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 10, minHeight: 50,
  },
  submitBtnLoading: { opacity: 0.7, cursor: "default" },
  clearCartBtn: {
    width: "100%", padding: 12, borderRadius: 10, border: "1px solid var(--border)", background: "transparent",
    color: "var(--muted)", fontSize: 13, cursor: "pointer", margin: "8px 0 14px", minHeight: 40,
  },

  emptyState: { textAlign: "center", padding: "30px 16px", color: "var(--muted)" },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 13.5, margin: 0 },

  toast: {
    position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 100,
    color: "#0a1a0a", padding: "10px 18px", borderRadius: 10, fontWeight: 600, fontSize: 13,
    display: "flex", alignItems: "center", gap: 6, boxShadow: "0 6px 20px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
  },
  toastIcon: { fontSize: 13 },

  historyHeaderBtn: { flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 0 },
  historyTopRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  exportBtn: {
    flexShrink: 0, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--green)",
    background: "var(--green-dim, transparent)", color: "var(--green)", fontSize: 12.5,
    fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
  },

  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 14 },
  statCard: { background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 12px" },
  statLabel: { fontSize: 10.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 700, color: "var(--text)" },

  historyEmpty: { textAlign: "center", padding: "20px 0", color: "var(--muted)", fontSize: 13 },
  historyErrorBox: { textAlign: "center", padding: "16px 0", color: "var(--amber)", fontSize: 13, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" },
  retryBtn: { padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", cursor: "pointer", fontSize: 12 },

  historyList: { display: "flex", flexDirection: "column", gap: 8 },
  historyRow: { border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" },
  historyRowMain: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" },
  historyInvoice: { fontSize: 13.5, fontWeight: 600, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 },
  statusBadge: { fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, textTransform: "uppercase" },
  historyMeta: { fontSize: 12, color: "var(--muted)", marginTop: 2 },
  historyTotal: { fontSize: 14, fontWeight: 700, color: "var(--green)" },
  historyItemCount: { fontSize: 11, color: "var(--muted)", marginTop: 2 },
  historyItemsList: { padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: 6, borderTop: "1px solid var(--border)", paddingTop: 10 },
  historyItemRow: { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, color: "var(--text2)" },
  historyNotes: { fontSize: 12, color: "var(--muted)", marginTop: 4, fontStyle: "italic" },

  viewBtn: {
    flexShrink: 0, padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)",
    background: "var(--bg2)", color: "var(--text)", fontSize: 12, cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modalBox: {
    width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto",
    background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, padding: 18,
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: 700, color: "var(--text)" },
  modalCloseBtn: { background: "none", border: "none", color: "var(--muted)", fontSize: 16, cursor: "pointer" },
  modalMetaGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 14, fontSize: 13 },
  modalTotalsBox: { marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 6 },
  modalTotalRow: { display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text2)" },
};
