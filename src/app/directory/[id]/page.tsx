'use client';
import { useState, useEffect } from 'react';
import { IconArrowLeft, IconMapPin, IconPhone, IconWorld, IconRosetteDiscountCheck, IconPaw, IconMail, IconUser, IconNotes } from '@tabler/icons-react';

interface Gaushala {
  id: number;
  name: string;
  state: string;
  district: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  cow_count: number | null;
  capacity: number | null;
  description: string;
  established_year: number | null;
  trust_reg_number: string | null;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  is_claimed: boolean;
  type_name: string;
  data_source: string;
}

export default function GaushalaDetailPage({ params }: { params: { id: string } }) {
  const [gaushala, setGaushala] = useState<Gaushala | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Claim form state
  const [showClaim, setShowClaim] = useState(false);
  const [claimName, setClaimName] = useState('');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimNote, setClaimNote] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimError, setClaimError] = useState('');

  useEffect(() => {
    fetch(`/api/directory/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setGaushala(data.data);
        else setNotFound(true);
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [params.id]);

  const submitClaim = async () => {
    setClaimSubmitting(true);
    setClaimError('');
    try {
      const res = await fetch('/api/directory/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gaushala_id: params.id,
          contact_name: claimName,
          contact_phone: claimPhone,
          contact_email: claimEmail,
          note: claimNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimSuccess(data.message);
        setShowClaim(false);
      } else {
        setClaimError(data.error);
      }
    } catch {
      setClaimError('Something went wrong. Please try again.');
    } finally {
      setClaimSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0', fontSize: 14, color: '#888' }}>
      Loading...
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0' }}>
      <div style={{ fontSize: 16, color: '#1a1a1a', marginBottom: 8 }}>Gaushala not found</div>
      <a href="/directory" style={{ fontSize: 13, color: '#3B6D11' }}>← Back to directory</a>
    </div>
  );

  if (!gaushala) return null;

  return (
    <main style={{ minHeight: '100vh', background: '#F7F5F0' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', background: '#fff', borderBottom: '0.5px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/directory" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 13 }}>
            <IconArrowLeft size={16} /> Directory
          </a>
          <span style={{ color: '#ccc' }}>·</span>
          <span style={{ fontSize: 13, color: '#888' }}>{gaushala.name}</span>
        </div>
        {gaushala.is_verified && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#3B6D11', background: '#EAF3DE', padding: '4px 12px', borderRadius: 20 }}>
            <IconRosetteDiscountCheck size={14} /> Verified listing
          </span>
        )}
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '24px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{gaushala.type_name}</div>
          <h1 style={{ fontSize: 24, fontWeight: 500, color: '#1a1a1a', marginBottom: 8 }}>{gaushala.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#888', marginBottom: 16 }}>
            <IconMapPin size={14} /> {gaushala.address || `${gaushala.district}, ${gaushala.state}`}
          </div>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>{gaushala.description}</p>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {gaushala.cow_count && (
            <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 10, padding: '16px' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>COWS SHELTERED</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#3B6D11', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconPaw size={18} /> {gaushala.cow_count.toLocaleString()}
              </div>
            </div>
          )}
          {gaushala.capacity && (
            <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 10, padding: '16px' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>CAPACITY</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>{gaushala.capacity.toLocaleString()}</div>
            </div>
          )}
          {gaushala.established_year && (
            <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 10, padding: '16px' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>ESTABLISHED</div>
              <div style={{ fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>{gaushala.established_year}</div>
            </div>
          )}
          {gaushala.trust_reg_number && (
            <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 10, padding: '16px' }}>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>TRUST REG. NO.</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{gaushala.trust_reg_number}</div>
            </div>
          )}
        </div>

        {/* Contact */}
        <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>Contact</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {gaushala.phone && (
              <a href={`tel:${gaushala.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#333' }}>
                <IconPhone size={15} color="#3B6D11" /> {gaushala.phone}
              </a>
            )}
            {gaushala.email && (
              <a href={`mailto:${gaushala.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#333' }}>
                <IconMail size={15} color="#3B6D11" /> {gaushala.email}
              </a>
            )}
            {gaushala.website && (
              <a href={gaushala.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3B6D11' }}>
                <IconWorld size={15} color="#3B6D11" /> {gaushala.website}
              </a>
            )}
            {!gaushala.phone && !gaushala.email && !gaushala.website && (
              <div style={{ fontSize: 13, color: '#888' }}>Contact details not yet available. Is this your gaushala? Claim this listing to add them.</div>
            )}
          </div>
        </div>

        {/* Data source note */}
        {gaushala.data_source === 'web_search' && (
          <div style={{ background: '#FAFAFA', border: '0.5px solid #e5e5e5', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: '#888' }}>
            ℹ️ This listing was generated from public sources and is pending verification. If you manage this gaushala, please claim it to update the details.
          </div>
        )}

        {/* Claim section */}
        {!gaushala.is_claimed && (
          <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '20px' }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Are you the manager of this gaushala?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Claim this listing to update details, add photos, and get a verified badge.</div>

            {claimSuccess ? (
              <div style={{ background: '#EAF3DE', border: '0.5px solid #C0DD97', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#27500A' }}>
                ✓ {claimSuccess}
              </div>
            ) : !showClaim ? (
              <button
                onClick={() => setShowClaim(true)}
                style={{ background: '#3B6D11', color: '#EAF3DE', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
              >
                Claim this listing
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {claimError && (
                  <div style={{ background: '#FFF0F0', border: '0.5px solid #FFCCCC', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#CC0000' }}>
                    {claimError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, display: 'flex', border: '0.5px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
                    <span style={{ padding: '0 10px', display: 'flex', alignItems: 'center', color: '#888' }}><IconUser size={14} /></span>
                    <input value={claimName} onChange={e => setClaimName(e.target.value)} placeholder="Your name" style={{ flex: 1, border: 'none', padding: '10px 0', fontSize: 13, outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', border: '0.5px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
                    <span style={{ padding: '0 10px', display: 'flex', alignItems: 'center', color: '#888' }}><IconPhone size={14} /></span>
                    <input value={claimPhone} onChange={e => setClaimPhone(e.target.value)} placeholder="Phone number" style={{ flex: 1, border: 'none', padding: '10px 0', fontSize: 13, outline: 'none' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', border: '0.5px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
                  <span style={{ padding: '0 10px', display: 'flex', alignItems: 'center', color: '#888' }}><IconMail size={14} /></span>
                  <input value={claimEmail} onChange={e => setClaimEmail(e.target.value)} placeholder="Email address" style={{ flex: 1, border: 'none', padding: '10px 0', fontSize: 13, outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', border: '0.5px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
                  <span style={{ padding: '0 10px', display: 'flex', alignItems: 'center', color: '#888', alignSelf: 'flex-start', paddingTop: 10 }}><IconNotes size={14} /></span>
                  <textarea value={claimNote} onChange={e => setClaimNote(e.target.value)} placeholder="Tell us how you are connected to this gaushala (optional)" rows={3} style={{ flex: 1, border: 'none', padding: '10px 0', fontSize: 13, outline: 'none', resize: 'none' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={submitClaim}
                    disabled={claimSubmitting}
                    style={{ background: '#3B6D11', color: '#EAF3DE', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, cursor: claimSubmitting ? 'not-allowed' : 'pointer', opacity: claimSubmitting ? 0.7 : 1 }}
                  >
                    {claimSubmitting ? 'Submitting...' : 'Submit claim'}
                  </button>
                  <button onClick={() => setShowClaim(false)} style={{ background: 'none', border: '0.5px solid #ccc', padding: '10px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#555' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
