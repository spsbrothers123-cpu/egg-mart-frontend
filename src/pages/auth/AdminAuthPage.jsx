import { useState } from 'react'
import PasswordField from '../../components/PasswordField'
import { login, registerAdmin } from '../../api'
import AuthShell, { AuthField, AuthMessage, AuthSubmitButton, authInputStyle } from './AuthShell'

export default function AdminAuthPage({ onLogin, onBack }) {
  const [mode, setMode] = useState('signin')

  return (
    <AuthShell
      title="ADMIN"
      subtitle="Shop &amp; cashier management"
      mode={mode}
      setMode={m => { setMode(m) }}
      onBack={onBack}
    >
      {mode === 'signin'
        ? <AdminSignIn onLogin={onLogin} />
        : <AdminSignUp onLogin={onLogin} onDone={() => setMode('signin')} />
      }
    </AuthShell>
  )
}

function AdminSignIn({ onLogin }) {
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
      if (data.user.role !== 'admin') {
        setErr('This account is not an admin account')
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
          placeholder="Enter admin username" autoFocus style={authInputStyle}
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

function AdminSignUp({ onLogin, onDone }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!username.trim() || !password.trim() || !confirm.trim()) {
      setErr('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setErr('Passwords do not match')
      return
    }
    setLoading(true)
    setErr('')
    try {
      const data = await registerAdmin(username.trim(), password)
      if (data?.token && data?.user) {
        // Backend auto-logs-in on registration
        onLogin(data.user.role, data.token)
        return
      }
      // Backend only confirmed account creation — send them to sign in
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
      <AuthField label="Confirm Password">
        <PasswordField
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setErr('') }}
          onEnter={handleSubmit}
          placeholder="Re-enter password"
        />
      </AuthField>
      <AuthMessage text={err} />
      <AuthMessage text={success} type="success" />
      <AuthSubmitButton
        onClick={handleSubmit} loading={loading}
        loadingLabel="Creating account…"
        label={<>Create Admin Account <i className="ti ti-arrow-right" style={{ marginLeft: 4 }}></i></>}
      />
    </>
  )
}
