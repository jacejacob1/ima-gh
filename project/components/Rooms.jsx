
const Rooms = ({ setPage }) => {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const rooms = [
    { id: 1, name: 'Standard Room', type: 'Single Occupancy', features: ['AC', '24×7 Hot Water', 'Reception Help', 'Clean Linen', 'Work Desk'] },
    { id: 2, name: 'Standard Room', type: 'Single Occupancy', features: ['AC', '24×7 Hot Water', 'Reception Help', 'Clean Linen', 'Work Desk'] },
    { id: 3, name: 'Standard Room', type: 'Single Occupancy', features: ['AC', '24×7 Hot Water', 'Reception Help', 'Clean Linen', 'Work Desk'] },
    { id: 4, name: 'Standard Room', type: 'Single Occupancy', features: ['AC', '24×7 Hot Water', 'Reception Help', 'Clean Linen', 'Work Desk'] },
    { id: 5, name: 'Standard Room', type: 'Single Occupancy', features: ['AC', '24×7 Hot Water', 'Reception Help', 'Clean Linen', 'Work Desk'] },
    { id: 6, name: 'Deluxe Room', type: 'Double Occupancy', features: ['AC', '24×7 Hot Water', 'Reception Help', 'Clean Linen', 'Work Desk', 'Extra Space'] },
    { id: 7, name: 'Deluxe Room', type: 'Double Occupancy', features: ['AC', '24×7 Hot Water', 'Reception Help', 'Clean Linen', 'Work Desk', 'Extra Space'] },
  ];

  const hall = {
    name: 'Conference & Event Hall',
    capacity: '300 Seats',
    features: ['Fully Air-Conditioned', 'Audio–Visual Setup', 'Podium & Stage', 'Flexible Seating', 'Ideal for CME & Seminars', 'Event Coordination Support'],
    desc: 'A spacious, fully air-conditioned hall accommodating up to 300 guests — perfect for medical conferences, continuing medical education (CME) programs, seminars, and social gatherings.'
  };

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(18px)', transition: 'all 0.6s ease', paddingTop: 70 }}>
      {/* Header */}
      <section style={{ padding: '80px 40px 60px', background: 'linear-gradient(160deg, #f4f0e8, #eaf2ef)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 14 }}>Accommodation</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 50px)', fontWeight: 700, color: '#1a2e28', margin: '0 0 16px' }}>Rooms & Facilities</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: '#4a5a55', maxWidth: 560, lineHeight: 1.7, margin: 0 }}>
            Seven well-appointed rooms and a large event hall — all designed for the medical professional's need for comfort, quiet, and convenience.
          </p>
        </div>
      </section>

      {/* Rooms Grid */}
      <section style={{ padding: '72px 40px', background: '#fcfaf6' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 36 }}>Guest Rooms</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {rooms.map((room) => (
              <div key={room.id} style={{
                background: '#fff', borderRadius: 12, overflow: 'hidden',
                border: '1px solid rgba(45,106,92,0.09)',
                boxShadow: '0 1px 8px rgba(45,106,92,0.05)',
                transition: 'all 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 36px rgba(45,106,92,0.12)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 8px rgba(45,106,92,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* Placeholder image */}
                <div style={{
                  height: 180, background: 'repeating-linear-gradient(45deg, #e8f0ed, #e8f0ed 8px, #eef5f2 8px, #eef5f2 16px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8
                }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a7c6f', opacity: 0.7, letterSpacing: '0.08em' }}>[ room interior photo ]</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a7c6f', opacity: 0.5 }}>Room {room.id}</div>
                </div>
                <div style={{ padding: '24px 24px 28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, fontWeight: 700, color: '#1a2e28', margin: 0 }}>{room.name}</h3>
                    <span style={{ background: '#eaf2ef', color: '#2d6a5c', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap', marginLeft: 8 }}>Room {room.id}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6a8a82', marginBottom: 18 }}>{room.type}</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {room.features.map((f, i) => (
                      <li key={i} style={{
                        fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#3a5a52',
                        background: '#f4f9f7', border: '1px solid rgba(45,106,92,0.12)',
                        padding: '4px 12px', borderRadius: 20,
                      }}>{f}</li>
                    ))}
                  </ul>
                  <button onClick={() => setPage('Booking')} style={{
                    marginTop: 22, width: '100%', background: '#2d6a5c', color: '#fff',
                    border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14, fontWeight: 600, padding: '11px', borderRadius: 6,
                    letterSpacing: '0.04em', transition: 'background 0.2s ease',
                  }}
                    onMouseEnter={e => e.target.style.background = '#1a4d42'}
                    onMouseLeave={e => e.target.style.background = '#2d6a5c'}
                  >Book This Room</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hall */}
      <section style={{ padding: '72px 40px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.18em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 36 }}>Event Space</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div style={{ height: 320, background: 'repeating-linear-gradient(135deg, #e2ede9, #e2ede9 10px, #ecf4f1 10px, #ecf4f1 20px)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a7c6f', opacity: 0.7, letterSpacing: '0.08em' }}>[ conference hall photo ]</div>
                <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a7c6f', opacity: 0.5 }}>300-seat air-conditioned hall</div>
              </div>
            </div>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: '#1a2e28', margin: '0 0 12px' }}>{hall.name}</h2>
              <div style={{ display: 'inline-block', background: '#1a2e28', color: '#fcfaf6', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, padding: '6px 16px', borderRadius: 4, marginBottom: 20 }}>Capacity: {hall.capacity}</div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#4a5a55', lineHeight: 1.75, marginBottom: 28 }}>{hall.desc}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {hall.features.map((f, i) => (
                  <li key={i} style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#3a5a52',
                    background: '#eaf2ef', border: '1px solid rgba(45,106,92,0.15)',
                    padding: '6px 14px', borderRadius: 20,
                  }}>{f}</li>
                ))}
              </ul>
              <button onClick={() => setPage('Contact')} style={{
                marginTop: 32, background: 'transparent', color: '#2d6a5c',
                border: '2px solid #2d6a5c', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                padding: '12px 28px', borderRadius: 6, letterSpacing: '0.04em',
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { e.target.style.background = 'rgba(45,106,92,0.06)'; }}
                onMouseLeave={e => { e.target.style.background = 'transparent'; }}
              >Enquire About Hall →</button>
            </div>
          </div>
        </div>
        <style>{`@media(max-width:768px){.hall-grid{grid-template-columns:1fr !important;}}`}</style>
      </section>
    </div>
  );
};

Object.assign(window, { Rooms });
