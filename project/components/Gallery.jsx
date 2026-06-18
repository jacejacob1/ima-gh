
const Gallery = () => {
  const [visible, setVisible] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState('All');
  const [lightbox, setLightbox] = React.useState(null);
  React.useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const filters = ['All', 'Rooms', 'Hall', 'Common Areas'];

  const items = [
    { id: 1, category: 'Rooms', label: 'Standard Room — Interior', sub: 'Room 1 · Single Occupancy', size: 'tall' },
    { id: 2, category: 'Rooms', label: 'Standard Room — Bed Area', sub: 'Room 2 · Single Occupancy', size: 'wide' },
    { id: 3, category: 'Hall', label: 'Conference Hall — Full View', sub: '300 Seat Capacity', size: 'wide' },
    { id: 4, category: 'Rooms', label: 'Deluxe Room — Interior', sub: 'Room 6 · Double Occupancy', size: 'normal' },
    { id: 5, category: 'Hall', label: 'Hall — Stage & Podium', sub: 'Audio Visual Setup', size: 'normal' },
    { id: 6, category: 'Common Areas', label: 'Reception Area', sub: '24×7 Staffed Desk', size: 'normal' },
    { id: 7, category: 'Rooms', label: 'Standard Room — Bathroom', sub: '24×7 Hot Water', size: 'normal' },
    { id: 8, category: 'Hall', label: 'Hall — Seating Layout', sub: 'Flexible Arrangement', size: 'wide' },
    { id: 9, category: 'Common Areas', label: 'Building Entrance', sub: 'Tambaram, Chennai', size: 'normal' },
    { id: 10, category: 'Rooms', label: 'Deluxe Room — Desk Area', sub: 'Room 7 · Work Desk', size: 'normal' },
    { id: 11, category: 'Common Areas', label: 'Corridor & Hallway', sub: 'Ground Floor', size: 'normal' },
    { id: 12, category: 'Hall', label: 'Hall — Event Setup', sub: 'CME / Seminar Mode', size: 'tall' },
  ];

  const colorMap = {
    'Rooms': ['#ddeee8', '#c8e0d8'],
    'Hall': ['#e2e8f0', '#ccd6e0'],
    'Common Areas': ['#f0ece0', '#e0d8c8'],
  };

  const filtered = activeFilter === 'All' ? items : items.filter(i => i.category === activeFilter);

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(18px)', transition: 'all 0.6s ease', paddingTop: 70 }}>
      {/* Header */}
      <section style={{ padding: '80px 40px 60px', background: 'linear-gradient(160deg, #f4f0e8, #eaf2ef)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 14 }}>Photo Gallery</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 4vw, 50px)', fontWeight: 700, color: '#1a2e28', margin: '0 0 16px' }}>A Glimpse Inside</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: '#4a5a55', maxWidth: 520, lineHeight: 1.7, margin: 0 }}>
            Browse our rooms, event hall, and common spaces — all crafted for quiet, productive stays.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section style={{ padding: '36px 40px 0', background: '#fcfaf6' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              background: activeFilter === f ? '#2d6a5c' : 'transparent',
              color: activeFilter === f ? '#fff' : '#4a5a55',
              border: activeFilter === f ? '1.5px solid #2d6a5c' : '1.5px solid rgba(45,106,92,0.25)',
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
              padding: '8px 20px', borderRadius: 24, transition: 'all 0.2s ease',
            }}>{f}</button>
          ))}
        </div>
      </section>

      {/* Grid */}
      <section style={{ padding: '36px 40px 80px', background: '#fcfaf6' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ columns: '3 280px', columnGap: 20 }}>
            {filtered.map((item) => {
              const [c1, c2] = colorMap[item.category];
              return (
                <div key={item.id} onClick={() => setLightbox(item)} style={{
                  breakInside: 'avoid', marginBottom: 20, borderRadius: 10, overflow: 'hidden',
                  cursor: 'pointer', border: '1px solid rgba(45,106,92,0.10)',
                  boxShadow: '0 1px 8px rgba(45,106,92,0.05)',
                  transition: 'all 0.25s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(45,106,92,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(45,106,92,0.05)'; }}
                >
                  <div style={{
                    height: item.size === 'tall' ? 300 : item.size === 'wide' ? 220 : 180,
                    background: `repeating-linear-gradient(45deg, ${c1}, ${c1} 8px, ${c2} 8px, ${c2} 16px)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6,
                  }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a6a5c', opacity: 0.7, letterSpacing: '0.07em', textAlign: 'center', padding: '0 12px' }}>[ {item.label.toLowerCase()} ]</div>
                  </div>
                  <div style={{ background: '#fff', padding: '14px 18px' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#1a2e28', marginBottom: 4 }}>{item.label}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#7a9a92' }}>{item.sub}</div>
                      <span style={{ background: '#eaf2ef', color: '#2d6a5c', fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>{item.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(10,20,18,0.85)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          backdropFilter: 'blur(6px)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', maxWidth: 700, width: '100%', boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ height: 380, background: `repeating-linear-gradient(45deg, ${colorMap[lightbox.category][0]}, ${colorMap[lightbox.category][0]} 12px, ${colorMap[lightbox.category][1]} 12px, ${colorMap[lightbox.category][1]} 24px)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#3a6a5c', opacity: 0.7 }}>[ {lightbox.label.toLowerCase()} ]</div>
            </div>
            <div style={{ padding: '24px 28px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#1a2e28', marginBottom: 4 }}>{lightbox.label}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#7a9a92' }}>{lightbox.sub}</div>
              </div>
              <button onClick={() => setLightbox(null)} style={{ background: '#1a2e28', color: '#fff', border: 'none', cursor: 'pointer', padding: '10px 18px', borderRadius: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { Gallery });
