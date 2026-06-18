
const Contact = () => {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const contacts = [
    {
      role: 'Reception',
      name: 'Front Desk',
      note: 'Available 24 × 7',
      phone: '+91 44 XXXX XXXX',
      phone2: '+91 98XXX XXXXX',
      email: 'reception@imatnsb.in',
      tag: '24×7',
    },
    {
      role: 'Administrator',
      name: 'Admin Office',
      note: 'Mon – Sat, 9 AM – 6 PM',
      phone: '+91 44 XXXX XXXX',
      phone2: null,
      email: 'admin@imatnsb.in',
      tag: 'Office Hours',
    },
    {
      role: 'Hall Bookings',
      name: 'Events Coordinator',
      note: 'For seminars & CME enquiries',
      phone: '+91 98XXX XXXXX',
      phone2: null,
      email: 'events@imatnsb.in',
      tag: 'Events',
    },
  ];

  const infoItems = [
    { label: 'Address', value: 'IMA TNSB Guesthouse\nTambaram, Chennai — 600 045\nTamil Nadu, India' },
    { label: 'Nearest Landmark', value: 'Near Tambaram Railway Station\n& Government Hospital' },
    { label: 'Check-in Time', value: '12:00 Noon' },
    { label: 'Check-out Time', value: '11:00 AM' },
  ];

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(18px)', transition: 'all 0.6s ease', paddingTop: 70 }}>
      {/* Header */}
      <section style={{ padding: '80px 40px 60px', background: 'linear-gradient(160deg, #f4f0e8, #eaf2ef)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 14 }}>Get in Touch</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 50px)', fontWeight: 700, color: '#1a2e28', margin: '0 0 16px' }}>Contact & Location</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: '#4a5a55', maxWidth: 520, lineHeight: 1.7, margin: 0 }}>
            Reach our reception team any time — we're available round the clock to assist with bookings, enquiries, and event planning.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section style={{ padding: '72px 40px', background: '#fcfaf6' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 36 }}>Contact Directory</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {contacts.map((c, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 12, padding: '32px 28px',
                border: '1px solid rgba(45,106,92,0.09)',
                boxShadow: '0 1px 8px rgba(45,106,92,0.05)',
                transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 36px rgba(45,106,92,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(45,106,92,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 6 }}>{c.role}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1a2e28' }}>{c.name}</div>
                  </div>
                  <span style={{ background: '#eaf2ef', color: '#2d6a5c', fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>{c.tag}</span>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#7a9a92', marginBottom: 20 }}>{c.note}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <a href={`tel:${c.phone.replace(/\s/g,'')}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                    padding: '10px 14px', borderRadius: 8, background: '#f4f9f7',
                    border: '1px solid rgba(45,106,92,0.1)', transition: 'background 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eaf2ef'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f4f9f7'}
                  >
                    <span style={{ fontSize: 16 }}>📞</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#1a2e28' }}>{c.phone}</span>
                  </a>
                  {c.phone2 && (
                    <a href={`tel:${c.phone2.replace(/\s/g,'')}`} style={{
                      display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                      padding: '10px 14px', borderRadius: 8, background: '#f4f9f7',
                      border: '1px solid rgba(45,106,92,0.1)', transition: 'background 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#eaf2ef'}
                      onMouseLeave={e => e.currentTarget.style.background = '#f4f9f7'}
                    >
                      <span style={{ fontSize: 16 }}>📞</span>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#1a2e28' }}>{c.phone2}</span>
                    </a>
                  )}
                  <a href={`mailto:${c.email}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none',
                    padding: '10px 14px', borderRadius: 8, background: '#f4f9f7',
                    border: '1px solid rgba(45,106,92,0.1)', transition: 'background 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eaf2ef'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f4f9f7'}
                  >
                    <span style={{ fontSize: 16 }}>✉</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#2d6a5c', fontWeight: 500 }}>{c.email}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location + Info */}
      <section style={{ padding: '0 40px 80px', background: '#fcfaf6' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {/* Map Placeholder */}
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 20 }}>Location</div>
            {/* Stylized map placeholder */}
            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(45,106,92,0.12)', boxShadow: '0 2px 16px rgba(45,106,92,0.07)', position: 'relative', height: 360, background: '#e8f0ed' }}>
              <svg width="100%" height="100%" viewBox="0 0 500 360" xmlns="http://www.w3.org/2000/svg">
                <rect width="500" height="360" fill="#e8f0ed"/>
                {/* Road grid */}
                <line x1="0" y1="180" x2="500" y2="180" stroke="#fff" strokeWidth="18" opacity="0.8"/>
                <line x1="250" y1="0" x2="250" y2="360" stroke="#fff" strokeWidth="14" opacity="0.7"/>
                <line x1="0" y1="100" x2="500" y2="100" stroke="#fff" strokeWidth="8" opacity="0.5"/>
                <line x1="0" y1="280" x2="500" y2="280" stroke="#fff" strokeWidth="8" opacity="0.5"/>
                <line x1="120" y1="0" x2="120" y2="360" stroke="#fff" strokeWidth="8" opacity="0.5"/>
                <line x1="380" y1="0" x2="380" y2="360" stroke="#fff" strokeWidth="8" opacity="0.5"/>
                {/* Blocks */}
                <rect x="130" y="110" width="110" height="60" rx="4" fill="#d4e6e1" opacity="0.6"/>
                <rect x="260" y="110" width="110" height="60" rx="4" fill="#d4e6e1" opacity="0.6"/>
                <rect x="130" y="200" width="110" height="70" rx="4" fill="#d4e6e1" opacity="0.5"/>
                <rect x="260" y="200" width="110" height="70" rx="4" fill="#d4e6e1" opacity="0.5"/>
                <rect x="10" y="110" width="100" height="60" rx="4" fill="#d4e6e1" opacity="0.4"/>
                <rect x="390" y="110" width="100" height="60" rx="4" fill="#d4e6e1" opacity="0.4"/>
                {/* Railway line */}
                <line x1="0" y1="310" x2="500" y2="310" stroke="#b0c8c0" strokeWidth="4" strokeDasharray="12 6"/>
                <text x="20" y="305" fill="#5a8a7a" fontFamily="monospace" fontSize="9" opacity="0.8">Tambaram Railway Station</text>
                {/* Pin */}
                <circle cx="250" cy="180" r="18" fill="#2d6a5c" opacity="0.2"/>
                <circle cx="250" cy="180" r="10" fill="#2d6a5c"/>
                <circle cx="250" cy="180" r="4" fill="#fff"/>
                <text x="268" y="176" fill="#1a2e28" fontFamily="monospace" fontSize="10" fontWeight="bold">IMA TNSB</text>
                <text x="268" y="188" fill="#4a7a6c" fontFamily="monospace" fontSize="9">Guesthouse</text>
                {/* Compass */}
                <text x="460" y="30" fill="#4a7a6c" fontFamily="monospace" fontSize="11" opacity="0.6">N ↑</text>
              </svg>
              <a href="https://maps.google.com/?q=Tambaram+Chennai" target="_blank" rel="noopener noreferrer" style={{
                position: 'absolute', bottom: 16, right: 16,
                background: '#2d6a5c', color: '#fff', textDecoration: 'none',
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                padding: '8px 16px', borderRadius: 6, boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
              }}>Open in Maps ↗</a>
            </div>
          </div>

          {/* Info Cards */}
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 20 }}>Guesthouse Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {infoItems.map((item, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 10, padding: '20px 22px', border: '1px solid rgba(45,106,92,0.09)', boxShadow: '0 1px 6px rgba(45,106,92,0.04)' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: '#2d6a5c', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8 }}>{item.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#1a2e28', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{item.value}</div>
                </div>
              ))}
              {/* How to reach */}
              <div style={{ background: '#1a2e28', borderRadius: 10, padding: '20px 22px' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: '#7ab8a6', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>How to Reach</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'rgba(252,250,246,0.75)', lineHeight: 1.7 }}>
                  <strong style={{ color: '#fcfaf6' }}>By Train:</strong> Tambaram Railway Station (Southern Railway) — 5 min walk<br />
                  <strong style={{ color: '#fcfaf6' }}>By Bus:</strong> Multiple TNSTC & MTC routes via Tambaram<br />
                  <strong style={{ color: '#fcfaf6' }}>By Car:</strong> GST Road (NH-48) — Tambaram exit
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`@media(max-width:768px){.contact-grid{grid-template-columns:1fr !important;}}`}</style>
      </section>
    </div>
  );
};

Object.assign(window, { Contact });
