
const Nav = ({ page, setPage }) => {
  const links = ['Home', 'Rooms', 'Gallery', 'Booking', 'Contact'];
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(252,250,246,0.97)' : 'rgba(252,250,246,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: scrolled ? '1px solid rgba(60,90,80,0.10)' : '1px solid transparent',
      transition: 'all 0.4s ease',
      padding: '0 40px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>
        <div onClick={() => setPage('Home')} style={{ cursor: 'pointer' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1a2e28', letterSpacing: '0.02em' }}>IMA TNSB</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#4a7c6f', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: -2 }}>Guesthouse · Tambaram</div>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: 36, alignItems: 'center' }} className="nav-links">
          {links.map(l => (
            <button key={l} onClick={() => setPage(l)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: page === l ? 600 : 400,
              color: page === l ? '#2d6a5c' : '#4a4a4a',
              letterSpacing: '0.06em', padding: '4px 0',
              borderBottom: page === l ? '2px solid #2d6a5c' : '2px solid transparent',
              transition: 'all 0.25s ease',
            }}>{l}</button>
          ))}
          <button onClick={() => setPage('Booking')} style={{
            background: '#2d6a5c', color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
            padding: '10px 22px', borderRadius: 4, letterSpacing: '0.06em',
            transition: 'background 0.2s ease',
          }}
            onMouseEnter={e => e.target.style.background = '#1a4d42'}
            onMouseLeave={e => e.target.style.background = '#2d6a5c'}
          >Book Now</button>
        </div>

        {/* Hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }} className="hamburger">
          <div style={{ width: 22, height: 2, background: '#1a2e28', marginBottom: 5, transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
          <div style={{ width: 22, height: 2, background: '#1a2e28', marginBottom: 5, opacity: menuOpen ? 0 : 1, transition: 'all 0.3s' }} />
          <div style={{ width: 22, height: 2, background: '#1a2e28', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: 'rgba(252,250,246,0.98)', padding: '16px 40px 24px', borderTop: '1px solid rgba(60,90,80,0.10)' }}>
          {links.map(l => (
            <button key={l} onClick={() => { setPage(l); setMenuOpen(false); }} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: page === l ? 600 : 400,
              color: page === l ? '#2d6a5c' : '#4a4a4a',
              padding: '12px 0', borderBottom: '1px solid rgba(60,90,80,0.06)',
            }}>{l}</button>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .nav-links { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  );
};

Object.assign(window, { Nav });
