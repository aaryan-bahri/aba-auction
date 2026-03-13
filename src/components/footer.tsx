const ORANGE = '#E8761A'

export default function Footer() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '36px',
      background: '#111',
      borderTop: '1px solid #1e1e1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      zIndex: 1000,
    }}>
      <span style={{ color: 'ORANGE', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
        &copy; {new Date().getFullYear()} ABA 9.0
      </span>
      <span style={{ color: '#222', fontSize: '11px' }}>—</span>
      <span style={{ color: '#555', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
        Made by <span style={{ color: '#555', }}>Aaryan Bahri</span>
      </span>
    </div>
  )
}