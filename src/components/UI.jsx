export function EggIcon({ size = 28 }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 28 34">
      <ellipse cx="14" cy="18" rx="11" ry="14" fill="#f5f5f0" opacity="0.9" />
    </svg>
  )
}

export function StatusBadge({ stock }) {
  const good   = stock > 50
  const low    = stock > 20
  return (
    <span style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 4,
      background: good ? 'var(--green-dim)' : low ? '#2a1f00' : '#1a0a0a',
      color:      good ? 'var(--green-text)' : low ? 'var(--amber)' : 'var(--red)',
    }}>
      {good ? 'In Stock' : low ? 'Low Stock' : 'Critical'}
    </span>
  )
}

export function SaleBadge({ status }) {
  return (
    <span style={{
      fontSize: 11, padding: '3px 8px', borderRadius: 4,
      background: status === 'paid' ? 'var(--green-dim)' : '#2a1500',
      color:      status === 'paid' ? 'var(--green-text)' : 'var(--amber)',
    }}>
      {status}
    </span>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action}
    </div>
  )
}

export function AddButton({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '8px 16px', borderRadius: 8, background: 'var(--green)',
      color: '#0a1a0a', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    }}>
      <i className="ti ti-plus" style={{ marginRight: 4 }}></i>{label}
    </button>
  )
}

export function TableHeader({ cols }) {
  return (
    <thead>
      <tr style={{ borderBottom: '1px solid var(--border)' }}>
        {cols.map(h => (
          <th key={h} style={{
            padding: '12px 16px', textAlign: 'left', fontSize: 11,
            color: 'var(--muted)', fontWeight: 500,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>{h}</th>
        ))}
      </tr>
    </thead>
  )
}

export function Modal({ show, onClose, title, children, width = 400 }) {
  if (!show) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{
        width, background: 'var(--bg1)', borderRadius: 16,
        border: '1px solid var(--border)', padding: '1.5rem',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18 }}>
            <i className="ti ti-x"></i>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  )
}

export const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg2)',
  color: 'var(--text)', fontSize: 13, outline: 'none',
}

export function ModalActions({ onCancel, onConfirm, confirmLabel = 'Save', confirmColor = 'var(--green)' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
      <button onClick={onCancel} style={{
        padding: '10px', borderRadius: 8, border: '1px solid var(--border)',
        background: 'var(--bg2)', color: 'var(--text2)', fontSize: 13, cursor: 'pointer',
      }}>Cancel</button>
      <button onClick={onConfirm} style={{
        padding: '10px', borderRadius: 8, background: confirmColor,
        color: confirmColor === 'var(--green)' ? '#0a1a0a' : '#fff',
        fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
      }}>{confirmLabel}</button>
    </div>
  )
}
