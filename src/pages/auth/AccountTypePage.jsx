import { EggIcon } from '../../components/UI'

function TypeCard({ icon, label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '18px 20px', borderRadius: 12, marginBottom: 12,
        background: 'var(--bg2)', border: '1px solid var(--border)',
        cursor: 'pointer', textAlign: 'left',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: 'var(--green-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid #2d5a3a', flexShrink: 0,
      }}>
        <i className={`ti ti-${icon}`} style={{ fontSize: 22, color: 'var(--green)' }}></i>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
      </div>
      <i className="ti ti-chevron-right" style={{ color: 'var(--muted)', fontSize: 18 }}></i>
    </button>
  )
}

export default function AccountTypePage({ onSelect }) {
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

        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Continue as
        </div>

        <TypeCard
          icon="shield"
          label="Admin"
          sub="Manage shops, cashiers & reports"
          onClick={() => onSelect('admin')}
        />
        <TypeCard
          icon="user"
          label="Cashier"
          sub="Billing counter access"
          onClick={() => onSelect('cashier')}
        />
      </div>
    </div>
  )
}
