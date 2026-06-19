import { useState } from 'react'
import { EggIcon } from './UI'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [pass,     setPass]     = useState('')
  const [err,      setErr]      = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin() {
    if (!username.trim() || !pass.trim()) { setErr('Enter username and password'); return }
    setLoading(true)
    setErr('')
    const error = await onLogin(username.trim(), pass)
    if (error) setErr(error)
    setLoading(false)
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
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Username</div>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter your username"
            autoFocus
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: 'var(--text)', fontSize: 14, outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Password</div>
          <input
            type="password"
            value={pass}
            onChange={e => { setPass(e.target.value); setErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter your password"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: 'var(--text)', fontSize: 14, outline: 'none',
            }}
          />
        </div>

        {err && (
          <div style={{
            fontSize: 13, color: 'var(--red)', marginBottom: 12,
            padding: '8px 12px', background: '#1a0a0a', borderRadius: 6,
          }}>{err}</div>
        )}

        <button onClick={handleLogin} disabled={loading} style={{
          width: '100%', padding: '12px', borderRadius: 8,
          background: loading ? 'var(--bg3)' : 'var(--green)',
          color: loading ? 'var(--muted)' : '#0a1a0a',
          fontSize: 15, fontWeight: 600, border: 'none', cursor: loading ? 'default' : 'pointer',
        }}>
          {loading ? 'Signing in…' : <>Sign In <i className="ti ti-arrow-right" style={{ marginLeft: 4 }}></i></>}
        </button>

        <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
          Use your account credentials to sign in
        </div>
      </div>
    </div>
  )
}
