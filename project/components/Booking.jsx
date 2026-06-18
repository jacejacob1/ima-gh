
const Booking = () => {
  const [visible, setVisible] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [submitted, setSubmitted] = React.useState(false);
  const [form, setForm] = React.useState({
    roomType: '', checkIn: '', checkOut: '', guests: '1',
    name: '', phone: '', email: '',
    idType: '', idNumber: '',
    notes: ''
  });
  const [errors, setErrors] = React.useState({});

  React.useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const totalSteps = 4;
  const rooms = ['Room 1 — Standard', 'Room 2 — Standard', 'Room 3 — Standard', 'Room 4 — Standard', 'Room 5 — Standard', 'Room 6 — Deluxe', 'Room 7 — Deluxe'];
  const idTypes = ['Aadhaar Card', 'PAN Card', 'Driving License', 'Voter ID', 'Passport'];

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const clearErr = (key) => setErrors(e => { const n = { ...e }; delete n[key]; return n; });

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.roomType) e.roomType = 'Please select a room';
      if (!form.checkIn) e.checkIn = 'Check-in date required';
      if (!form.checkOut) e.checkOut = 'Check-out date required';
      if (form.checkIn && form.checkOut && form.checkOut <= form.checkIn) e.checkOut = 'Check-out must be after check-in';
    }
    if (s === 2) {
      if (!form.name.trim()) e.name = 'Full name is required';
      if (!form.phone.trim()) e.phone = 'Phone number is required';
      else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = 'Enter a valid 10-digit Indian mobile number';
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    }
    if (s === 3) {
      if (!form.idType) e.idType = 'Please select an ID type';
      if (!form.idNumber.trim()) e.idNumber = 'ID number is required';
    }
    return e;
  };

  const next = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    if (step < totalSteps) setStep(s => s + 1);
  };

  const Field = ({ label, id, type = 'text', value, onChange, error, placeholder, required, children }) => (
    <div style={{ marginBottom: 22 }}>
      <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#2a3a35', marginBottom: 7, letterSpacing: '0.04em' }}>
        {label}{required && <span style={{ color: '#c0392b', marginLeft: 3 }}>*</span>}
      </label>
      {children || (
        <input type={type} value={value} onChange={e => { onChange(e.target.value); clearErr(id); }}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px',
            fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#1a2e28',
            background: '#fff', border: `1.5px solid ${error ? '#c0392b' : 'rgba(45,106,92,0.25)'}`,
            borderRadius: 7, outline: 'none', transition: 'border-color 0.2s ease',
          }}
          onFocus={e => { if (!error) e.target.style.borderColor = '#2d6a5c'; }}
          onBlur={e => { if (!error) e.target.style.borderColor = 'rgba(45,106,92,0.25)'; }}
        />
      )}
      {error && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#c0392b', marginTop: 5 }}>{error}</div>}
    </div>
  );

  const SelectField = ({ label, id, value, onChange, error, options, placeholder, required }) => (
    <Field label={label} id={id} error={error} required={required}>
      <select value={value} onChange={e => { onChange(e.target.value); clearErr(id); }}
        style={{
          width: '100%', padding: '12px 14px',
          fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: value ? '#1a2e28' : '#9ab0a8',
          background: '#fff', border: `1.5px solid ${error ? '#c0392b' : 'rgba(45,106,92,0.25)'}`,
          borderRadius: 7, outline: 'none', appearance: 'none', cursor: 'pointer',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%232d6a5c' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
        }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );

  const stepLabels = ['Room', 'Personal', 'Identity', 'Confirm'];

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(18px)', transition: 'all 0.6s ease', paddingTop: 70, minHeight: '100vh', background: '#fcfaf6' }}>
      <section style={{ padding: '60px 40px 24px', background: 'linear-gradient(160deg, #f4f0e8, #eaf2ef)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.2em', color: '#2d6a5c', textTransform: 'uppercase', marginBottom: 14 }}>Reservations</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#1a2e28', margin: 0 }}>Book Your Room</h1>
        </div>
      </section>

      <section style={{ padding: '40px 40px 80px', background: '#fcfaf6' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {!submitted ? (
            <>
              {/* Step indicator */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 44 }}>
                {stepLabels.map((label, i) => {
                  const n = i + 1;
                  const done = step > n;
                  const active = step === n;
                  return (
                    <React.Fragment key={n}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: done ? '#2d6a5c' : active ? '#2d6a5c' : '#e8f0ed',
                          color: done || active ? '#fff' : '#6a9a8c',
                          fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700,
                          transition: 'all 0.3s ease',
                          boxShadow: active ? '0 4px 16px rgba(45,106,92,0.3)' : 'none',
                        }}>{done ? '✓' : n}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: active ? 600 : 400, color: active ? '#2d6a5c' : done ? '#2d6a5c' : '#9ab0a8', whiteSpace: 'nowrap' }}>{label}</div>
                      </div>
                      {i < stepLabels.length - 1 && (
                        <div style={{ flex: 1, height: 2, background: step > n ? '#2d6a5c' : '#e8f0ed', margin: '0 8px', marginBottom: 20, transition: 'background 0.3s ease' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Card */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '40px 40px', border: '1px solid rgba(45,106,92,0.09)', boxShadow: '0 2px 20px rgba(45,106,92,0.07)' }}>

                {/* Step 1: Room Selection */}
                {step === 1 && (
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#1a2e28', margin: '0 0 28px' }}>Select Room & Dates</h2>
                    <SelectField label="Room" id="roomType" value={form.roomType} onChange={v => set('roomType', v)} error={errors.roomType} options={rooms} placeholder="Choose a room" required />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <Field label="Check-in Date" id="checkIn" type="date" value={form.checkIn} onChange={v => set('checkIn', v)} error={errors.checkIn} required>
                        <input type="date" value={form.checkIn} min={today} onChange={e => { set('checkIn', e.target.value); clearErr('checkIn'); }}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#1a2e28', background: '#fff', border: `1.5px solid ${errors.checkIn ? '#c0392b' : 'rgba(45,106,92,0.25)'}`, borderRadius: 7, outline: 'none' }} />
                        {errors.checkIn && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#c0392b', marginTop: 5 }}>{errors.checkIn}</div>}
                      </Field>
                      <Field label="Check-out Date" id="checkOut" type="date" value={form.checkOut} onChange={v => set('checkOut', v)} error={errors.checkOut} required>
                        <input type="date" value={form.checkOut} min={form.checkIn || today} onChange={e => { set('checkOut', e.target.value); clearErr('checkOut'); }}
                          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#1a2e28', background: '#fff', border: `1.5px solid ${errors.checkOut ? '#c0392b' : 'rgba(45,106,92,0.25)'}`, borderRadius: 7, outline: 'none' }} />
                        {errors.checkOut && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#c0392b', marginTop: 5 }}>{errors.checkOut}</div>}
                      </Field>
                    </div>
                    <SelectField label="Number of Guests" id="guests" value={form.guests} onChange={v => set('guests', v)} options={['1', '2']} placeholder="" />
                  </div>
                )}

                {/* Step 2: Personal Details */}
                {step === 2 && (
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#1a2e28', margin: '0 0 28px' }}>Personal Details</h2>
                    <Field label="Full Name" id="name" value={form.name} onChange={v => set('name', v)} error={errors.name} placeholder="Dr. / Mr. / Ms. Your Full Name" required />
                    <Field label="Mobile Number" id="phone" type="tel" value={form.phone} onChange={v => set('phone', v)} error={errors.phone} placeholder="10-digit Indian mobile number" required />
                    <Field label="Email Address" id="email" type="email" value={form.email} onChange={v => set('email', v)} error={errors.email} placeholder="your@email.com (optional)" />
                    <div style={{ marginBottom: 22 }}>
                      <label style={{ display: 'block', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#2a3a35', marginBottom: 7 }}>Special Requests</label>
                      <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any specific requirements..." rows={3}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#1a2e28', background: '#fff', border: '1.5px solid rgba(45,106,92,0.25)', borderRadius: 7, outline: 'none', resize: 'vertical' }} />
                    </div>
                  </div>
                )}

                {/* Step 3: ID Verification */}
                {step === 3 && (
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#1a2e28', margin: '0 0 8px' }}>Identity Verification</h2>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6a8a82', marginBottom: 28, lineHeight: 1.6 }}>A valid government-issued photo ID is required to complete your booking. Your information is stored securely and used only for registration purposes.</p>
                    <SelectField label="ID Type" id="idType" value={form.idType} onChange={v => set('idType', v)} error={errors.idType} options={idTypes} placeholder="Select ID type" required />
                    <Field label="ID Number" id="idNumber" value={form.idNumber} onChange={v => set('idNumber', v)} error={errors.idNumber} placeholder={
                      form.idType === 'Aadhaar Card' ? 'XXXX XXXX XXXX' :
                      form.idType === 'PAN Card' ? 'ABCDE1234F' :
                      form.idType === 'Driving License' ? 'TN-XX-XXXX-XXXXXXX' :
                      'Enter ID number'
                    } required />
                    <div style={{ background: '#f4f9f7', border: '1px solid rgba(45,106,92,0.15)', borderRadius: 8, padding: '14px 18px' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#3a6a5c', lineHeight: 1.6 }}>
                        🔒 Your ID details are encrypted and used solely for guest registration as required by government norms.
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Confirm */}
                {step === 4 && (
                  <div>
                    <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: '#1a2e28', margin: '0 0 28px' }}>Review & Confirm</h2>
                    {[
                      { section: 'Room & Dates', items: [
                        ['Room', form.roomType],
                        ['Check-in', form.checkIn],
                        ['Check-out', form.checkOut],
                        ['Guests', form.guests],
                      ]},
                      { section: 'Guest Details', items: [
                        ['Name', form.name],
                        ['Mobile', form.phone],
                        ['Email', form.email || '—'],
                        ...(form.notes ? [['Notes', form.notes]] : []),
                      ]},
                      { section: 'Identity', items: [
                        ['ID Type', form.idType],
                        ['ID Number', form.idNumber.replace(/./g, (c, i) => i < form.idNumber.length - 4 ? '•' : c)],
                      ]},
                    ].map(group => (
                      <div key={group.section} style={{ marginBottom: 24 }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: '#2d6a5c', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{group.section}</div>
                        <div style={{ background: '#f8fbf9', border: '1px solid rgba(45,106,92,0.1)', borderRadius: 8, overflow: 'hidden' }}>
                          {group.items.map(([k, v], i) => (
                            <div key={k} style={{ display: 'flex', padding: '12px 18px', borderBottom: i < group.items.length - 1 ? '1px solid rgba(45,106,92,0.08)' : 'none' }}>
                              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6a8a82', width: 110, flexShrink: 0 }}>{k}</div>
                              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#1a2e28' }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div style={{ background: '#eaf7f2', border: '1px solid rgba(45,106,92,0.2)', borderRadius: 8, padding: '14px 18px', marginBottom: 4 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#1a5c44', lineHeight: 1.6 }}>
                        By confirming, you agree to IMA TNSB Guesthouse's stay policies. The reception team will contact you to confirm availability.
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, gap: 12 }}>
                  {step > 1 ? (
                    <button onClick={() => { setErrors({}); setStep(s => s - 1); }} style={{
                      background: 'transparent', color: '#2d6a5c', border: '1.5px solid #2d6a5c',
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                      padding: '12px 28px', borderRadius: 7, transition: 'all 0.2s ease',
                    }}>← Back</button>
                  ) : <div />}
                  {step < totalSteps ? (
                    <button onClick={next} style={{
                      background: '#2d6a5c', color: '#fff', border: 'none', cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                      padding: '12px 32px', borderRadius: 7, transition: 'all 0.2s ease',
                      boxShadow: '0 4px 16px rgba(45,106,92,0.25)',
                    }}
                      onMouseEnter={e => e.target.style.background = '#1a4d42'}
                      onMouseLeave={e => e.target.style.background = '#2d6a5c'}
                    >Continue →</button>
                  ) : (
                    <button onClick={() => setSubmitted(true)} style={{
                      background: '#2d6a5c', color: '#fff', border: 'none', cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                      padding: '12px 32px', borderRadius: 7, transition: 'all 0.2s ease',
                      boxShadow: '0 4px 16px rgba(45,106,92,0.25)',
                    }}
                      onMouseEnter={e => e.target.style.background = '#1a4d42'}
                      onMouseLeave={e => e.target.style.background = '#2d6a5c'}
                    >Confirm Booking ✓</button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Success state */
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#eaf7f2', border: '2px solid #2d6a5c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 32 }}>✓</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#1a2e28', margin: '0 0 12px' }}>Booking Request Sent!</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#4a6a62', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 36px' }}>
                Thank you, <strong>{form.name}</strong>. Your room reservation request for <strong>{form.roomType}</strong> has been received. The reception team will contact you on <strong>{form.phone}</strong> to confirm availability.
              </p>
              <button onClick={() => { setSubmitted(false); setStep(1); setForm({ roomType: '', checkIn: '', checkOut: '', guests: '1', name: '', phone: '', email: '', idType: '', idNumber: '', notes: '' }); }} style={{
                background: '#2d6a5c', color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                padding: '13px 32px', borderRadius: 7,
              }}>Make Another Booking</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

Object.assign(window, { Booking });
