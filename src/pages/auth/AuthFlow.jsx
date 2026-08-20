import { useState } from 'react'
import AccountTypePage from './AccountTypePage'
import AdminAuthPage from './AdminAuthPage'
import CashierAuthPage from './CashierAuthPage'

// Replaces the old single LoginPage. Keeps the same external contract
// (onLogin(role, token)) so App.jsx's session/state wiring is untouched —
// only what happens *before* a token exists has changed.
export default function AuthFlow({ onLogin }) {
  const [accountType, setAccountType] = useState(null) // null | 'admin' | 'cashier'

  if (!accountType) {
    return <AccountTypePage onSelect={setAccountType} />
  }

  if (accountType === 'admin') {
    return <AdminAuthPage onLogin={onLogin} onBack={() => setAccountType(null)} />
  }

  return <CashierAuthPage onLogin={onLogin} onBack={() => setAccountType(null)} />
}
