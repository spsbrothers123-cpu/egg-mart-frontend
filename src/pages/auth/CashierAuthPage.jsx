import { useState } from 'react'
import PasswordField from '../../components/PasswordField'
import { login, registerCashier } from '../../api'
import AuthShell, { AuthField, AuthMessage, AuthSubmitButton, authInputStyle } from './AuthShell'

export default function CashierAuthPage({ onLogin, onBack }) {
  const [mode, setMode] = useState('signin')

  return (
    <AuthShell
      title="CASHIER"
      subtitle="Billing counter access"
      mode={mode}
      setMode={setMode}
      onBack={onBack}
    >
      {mode === 'signin'
        ? <CashierSignIn onLogin={onLogin} />
        : <CashierSignUp onLogin={onLogin} onDone={() => setMode('signin')} />
      }
    </AuthShell>
  )
}

function CashierSignIn({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!username.trim() || !password.trim()) {
      setErr('Please enter username and password')
      return
    }
    setLoading(true)
    setErr('')
    try {
      const data = await login(username.trim(), password)
      if (data.user.role !== 'cashier') {
        setErr('This account is not a cashier account')
        setLoading(false)
        return
      }
      onLogin(data.user.role, data.token)
    } catch (e) {
      setErr(e.message === 'Failed to fetch' ? 'Cannot reach server. Check if backend is running.' : (e.message || 'Invalid credentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AuthField label="Username">
        <input
          type="text" value={username}
          onChange={e => { setUsername(e.target.value); setErr('') }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Enter cashier username" autoFocus style={authInputStyle}
        />
      </AuthField>
      <AuthField label="Password">
        <PasswordField
          value={password}
          onChange={e => { setPassword(e.target.value); setErr('') }}
          onEnter={handleSubmit}
          placeholder="Enter password"
        />
      </AuthField>
      <AuthMessage text={err} />
      <AuthSubmitButton
        onClick={handleSubmit} loading={loading}
        loadingLabel="Signing in…"
        label={<>Sign In <i className="ti ti-arrow-right" style={{ marginLeft: 4 }}></i></>}
      />
    </>
  )
}

function CashierSignUp({ onLogin, onDone }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [shopLocation, setShopLocation] = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!username.trim() || !password.trim() || !shopLocation.trim()) {
      setErr('Please fill in all fields, including shop location')
      return
    }
    if (password.length < 8) {
      setErr('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    setErr('')
    try {
      const data = await registerCashier(username.trim(), password, shopLocation.trim())
      if (data?.token && data?.user) {
        onLogin(data.user.role, data.token)
        return
      }
      setSuccess('Account created. Please sign in.')
      setTimeout(onDone, 1200)
    } catch (e) {
      setErr(e.message === 'Failed to fetch' ? 'Cannot reach server. Check if backend is running.' : (e.message || 'Could not create account'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <AuthField label="Username">
        <input
          type="text" value={username}
          onChange={e => { setUsername(e.target.value); setErr('') }}
          placeholder="Choose a username" autoFocus style={authInputStyle}
        />
      </AuthField>
      <AuthField label="Password">
        <PasswordField
          value={password}
          onChange={e => { setPassword(e.target.value); setErr('') }}
          placeholder="Create a password"
        />
      </AuthField>
      <AuthField label="Shop Location">
        <input
          type="text" value={shopLocation}
          onChange={e => { setShopLocation(e.target.value); setErr('') }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. Coimbatore, RS Puram, Gandhipuram"
          style={authInputStyle}
        />
      </AuthField>
      <AuthMessage text={err} />
      <AuthMessage text={success} type="success" />
      <AuthSubmitButton
        onClick={handleSubmit} loading={loading}
        loadingLabel="Creating account…"
        label={<>Create Cashier Account <i className="ti ti-arrow-right" style={{ marginLeft: 4 }}></i></>}
      />
    </>
  )
}
