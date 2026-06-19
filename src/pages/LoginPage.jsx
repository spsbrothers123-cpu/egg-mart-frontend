import { useState } from 'react'
import { EggIcon } from '../components/UI'

const API = 'http://localhost:3001'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [pass,     setPass]     = useState('')
  const [err,      setErr]      = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin() {
    if (!username.trim() || !pass.trim()) {
      setErr('Please enter username and password')
      return
    }
    setLoading(true)
    setErr('')

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: pass }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErr(data.error || 'Invalid credentials')
        setLoading(false)
        return
      }

      // data = { token, user: { id, name, username, role } }
      onLogin(data.user.role, data.token)
    } catch {
      setErr('Cannot reach server. Check if backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg0)',
    }}>
      <div style={{
        width: 380, padding: '2.5rem', background: 'var(--bg1)',
        borderRadius: 16, border: '1px solid var(--border)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, background: 'var(--green-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', border: '1px solid #2d5a3a',
          }}>
            <EggIcon size={32} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--green)' }}>EGG MART</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Billing POS System</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</div>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter username"
            autoFocus
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</div>
          <input
            type="password"
            value={pass}
            onChange={e => { setPass(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter password"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {err && (
          <div style={{
            fontSize: 13, color: 'var(--red)', marginBottom: 12,
            padding: '8px 12px', background: '#1a0a0a', borderRadius: 6,
          }}>{err}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: 8,
            background: loading ? 'var(--green-dim)' : 'var(--green)',
            color: '#0a1a0a', fontSize: 15, fontWeight: 600,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading
            ? <><i className="ti ti-loader-2" style={{ marginRight: 6, animation: 'spin 1s linear infinite' }}></i>Signing in…</>
            : <>Sign In <i className="ti ti-arrow-right" style={{ marginLeft: 4 }}></i></>
          }
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
