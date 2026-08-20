import { EggIcon } from '../../components/UI'

export const authInputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg2)',
  color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

export function AuthField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

export function AuthMessage({ text, type = 'error' }) {
  if (!text) return null
  const isError = type === 'error'
  return (
    <div style={{
      fontSize: 13, color: isError ? 'var(--red)' : 'var(--green)', marginBottom: 12,
      padding: '8px 12px', background: isError ? '#1a0a0a' : 'var(--green-dim)', borderRadius: 6,
    }}>{text}</div>
  )
}

export function AuthSubmitButton({ onClick, loading, loadingLabel, label }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%', padding: '12px', borderRadius: 8,
        background: loading ? 'var(--green-dim)' : 'var(--green)',
        color: '#0a1a0a', fontSize: 15, fontWeight: 600,
        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
      }}
    >
      {loading
        ? <><i className="ti ti-loader-2" style={{ marginRight: 6, animation: 'spin 1s linear infinite' }}></i>{loadingLabel}</>
        : label
      }
    </button>
  )
}

export default function AuthShell({ title, subtitle, mode, setMode, onBack, children }) {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg0)',
    }}>
      <div style={{
        width: 380, padding: '2.5rem', background: 'var(--bg1)',
        borderRadius: 16, border: '1px solid var(--border)', position: 'relative',
      }}>
        <button
          onClick={onBack}
          aria-label="Back"
          style={{
            position: 'absolute', top: 18, left: 18, background: 'none', border: 'none',
            color: 'var(--muted)', cursor: 'pointer', fontSize: 18, padding: 4,
          }}
        >
          <i className="ti ti-arrow-left"></i>
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: 'var(--green-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.75rem', border: '1px solid #2d5a3a',
          }}>
            <EggIcon size={28} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--green)' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{subtitle}</div>
        </div>

        {/* Sign In / Sign Up tabs */}
        <div style={{
          display: 'flex', background: 'var(--bg2)', borderRadius: 8, padding: 3, marginBottom: 20,
          border: '1px solid var(--border)',
        }}>
          {['signin', 'signup'].map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: mode === m ? 'var(--green)' : 'transparent',
                color: mode === m ? '#0a1a0a' : 'var(--muted)',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {children}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
