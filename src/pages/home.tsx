import { useNavigate } from 'react-router-dom'

const ORANGE = '#E8761A'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: '#000000',
      color: 'white',
      fontFamily: "'Segoe UI', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box',
      padding: '40px'
    }}>

      {/* Logo */}
      <img
        src="/logo.png"
        alt="ABA Logo"
        style={{ width: '260px', marginBottom: '24px' }}
      />

      {/* Title */}
      <h1 style={{
        fontSize: '42px',
        color: ORANGE,
        margin: '0 0 8px 0',
        fontWeight: 'bold',
        letterSpacing: '2px'
      }}>
        ABA 9.0
      </h1>
      <p style={{
        color: '#666',
        fontSize: '12px',
        letterSpacing: '4px',
        margin: '0 0 56px 0',
        textTransform: 'uppercase'
      }}>
        Auction
      </p>

      {/* Nav Cards */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <NavCard title="Admin" subtitle="Control the auction" onClick={() => navigate('/admin')} />
        <NavCard title="View Live" subtitle="Live auction display" onClick={() => navigate('/projector')} />
        <NavCard title="View Teams" subtitle="View rosters & purses" onClick={() => navigate('/teams')} />
      </div>
    </div>
  )
}

function NavCard({ title, subtitle, onClick }: {
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#141414',
        border: `1px solid ${ORANGE}`,
        borderRadius: '12px',
        padding: '44px 56px',
        width: '220px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'background 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#1a1a1a'
        e.currentTarget.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#141414'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <h2 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '22px', fontWeight: '600' }}>
        {title}
      </h2>
      <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{subtitle}</p>
    </div>
  )
}