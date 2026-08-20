import { useState } from 'react'

// Reusable password input with a show/hide visibility toggle. Used by every
// auth screen (Admin Sign In/Sign Up, Cashier Sign In/Sign Up) so the toggle
// behaves identically everywhere instead of being reimplemented per form.
export default function PasswordField({ value, onChange, placeholder = 'Enter password', autoFocus = false, onEnter }) {
  const [visible, setVisible] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onKeyDown={e => e.key === 'Enter' && onEnter && onEnter()}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          width: '100%', padding: '10px 40px 10px 12px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--bg2)',
          color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
        }}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        style={{
          position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', fontSize: 16, padding: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <i className={`ti ti-${visible ? 'eye-off' : 'eye'}`}></i>
      </button>
    </div>
  )
}
