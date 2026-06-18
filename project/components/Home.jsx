
const Home = ({ setPage }) => {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const amenities = [
    { icon: '❄', title: '7 AC Rooms', desc: 'Fully air-conditioned private rooms designed for comfort and quiet rest.' },
    { icon: '🚿', title: '24×7 Hot Water', desc: 'Continuous hot water supply round the clock, every day of the year.' },
    { icon: '🛎', title: 'Reception 24×7', desc: 'On-call reception assistance available at any hour for every need.' },
    { icon: '🏛', title: '300-Seat AC Hall', desc: 'Spacious air-conditioned hall ideal for seminars, conferences & events.' },
  ];

  const highlights = [
    { label: 'Location', value: 'Tambaram, Chennai' },
    { label: 'Rooms', value: '7 AC Rooms' },
    { label: 'Hall Capacity', value: '300 Seats' },
    { label: 'Availability', value: '24 × 7' },
  ];

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(18px)', transition: 'all 0.6s ease' }}>
      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        background: 'linear-gradient(160deg, #f4f0e8 0%, #eaf2ef 60%, #ddeee8 100%)',
        padding: '120px 40px 80px', position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative background circle */}
        <div style={{ position: 'absolute', right: -120, top: '50%', transform: 'translateY(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'rgba(45,106,92,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 80, top: '50%', transform: 'translateY(-50%)', width: 340, height: 340, borderRadius: '50%', background: 'rgba(45,106,92,0.08)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 20 }}>
              IMA TNSB Guesthouse · Tambaram, Chennai
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(38px, 5vw, 62px)', fontWeight: 700, color: '#1a2e28', lineHeight: 1.1, margin: '0 0 24px' }}>
              A Restful Stay<br />for Medical<br /><em style={{ color: '#2d6a5c', fontStyle: 'italic' }}>Professionals</em>
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: '#4a5a55', lineHeight: 1.75, maxWidth: 480, marginBottom: 40 }}>
              Designed exclusively for doctors and medical students in and around Tambaram and Chennai. Quiet, clean, and fully equipped — so you can focus on what matters most.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button onClick={() => setPage('Booking')} style={{
                background: '#2d6a5c', color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
                padding: '15px 36px', borderRadius: 4, letterSpacing: '0.05em',
                transition: 'all 0.25s ease', boxShadow: '0 4px 20px rgba(45,106,92,0.25)'
              }}
                onMouseEnter={e => { e.target.style.background = '#1a4d42'; e.target.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.target.style.background = '#2d6a5c'; e.target.style.transform = 'translateY(0)'; }}
              >Book a Room</button>
              <button onClick={() => setPage('Rooms')} style={{
                background: 'transparent', color: '#2d6a5c', border: '2px solid #2d6a5c', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
                padding: '13px 34px', borderRadius: 4, letterSpacing: '0.05em',
                transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => { e.target.style.background = 'rgba(45,106,92,0.06)'; }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; }}
              >Explore Rooms</button>
            </div>
          </div>

          {/* Stats card */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {highlights.map((h, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
                borderRadius: 12, padding: '28px 24px',
                border: '1px solid rgba(45,106,92,0.12)',
                boxShadow: '0 2px 16px rgba(45,106,92,0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(45,106,92,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(45,106,92,0.06)'; }}
              >
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: '#2d6a5c', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{h.label}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: '#1a2e28' }}>{h.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Responsive */}
        <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          }
        `}</style>
      </section>

      {/* Amenities */}
      <section style={{ padding: '100px 40px', background: '#fcfaf6' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 14 }}>What We Offer</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#1a2e28', margin: 0 }}>Amenities & Facilities</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28 }}>
            {amenities.map((a, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 12, padding: '36px 28px',
                border: '1px solid rgba(45,106,92,0.08)',
                boxShadow: '0 1px 8px rgba(45,106,92,0.04)',
                transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 32px rgba(45,106,92,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(45,106,92,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(45,106,92,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(45,106,92,0.08)'; }}
              >
                <div style={{ fontSize: 32, marginBottom: 18 }}>{a.icon}</div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1a2e28', margin: '0 0 10px' }}>{a.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#6a7a75', lineHeight: 1.65, margin: 0 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '80px 40px', background: '#1a2e28' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: '#fcfaf6', margin: '0 0 16px' }}>
            Serving the Medical Community of Chennai
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'rgba(252,250,246,0.65)', lineHeight: 1.7, marginBottom: 36 }}>
            Whether you're attending a conference, a CME, or need a quiet place to rest between shifts — IMA TNSB Guesthouse is your home in Tambaram.
          </p>
          <button onClick={() => setPage('Booking')} style={{
            background: '#b8956a', color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600,
            padding: '15px 40px', borderRadius: 4, letterSpacing: '0.06em',
            transition: 'all 0.25s ease',
          }}
            onMouseEnter={e => { e.target.style.background = '#9a7a56'; e.target.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.target.style.background = '#b8956a'; e.target.style.transform = 'translateY(0)'; }}
          >Reserve Your Room</button>
        </div>
      </section>
    </div>
  );
};

Object.assign(window, { Home });
