'use client';
import { useState, useCallback } from 'react';
import { IconArrowLeft, IconCheck, IconX, IconMapPin, IconPhone, IconMail, IconUser } from '@tabler/icons-react';

interface Claim {
  id: number;
  gaushala_id: number;
  gaushala_name: string;
  state: string;
  district: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  note: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  is_claimed: boolean;
}

export default function AdminClaimsPage() {
  const [secret, setSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchClaims = useCallback(async (s: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/claims', {
        headers: { 'x-admin-secret': s }
      });
      const data = await res.json();
      if (data.success) {
        setClaims(data.data);
        setAuthenticated(true);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAction = async (claim_id: number, gaushala_id: number, action: 'approve' | 'reject') => {
    setActionLoading(claim_id);
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ claim_id, gaushala_id, action }),
      });
      const data = await res.json();
      if (data.success) fetchClaims(secret);
    } catch {
      setError('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = claims.filter(c => filter === 'all' ? true : c.status === filter);

  const statusColor = (s: string) => {
    if (s === 'pending') return { bg: '#FAEEDA', color: '#633806' };
    if (s === 'approved') return { bg: '#EAF3DE', color: '#27500A' };
    return { bg: '#FFF0F0', color: '#CC0000' };
  };

  if (!authenticated) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0' }}>
        <div style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '32px', width: 360 }}>
          <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>Admin — Claims Review</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>gaushala.network</div>
          {error && <div style={{ background: '#FFF0F0', border: '0.5px solid #FFCCCC', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#CC0000', marginBottom: 16 }}>{error}</div>}
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchClaims(secret)}
            placeholder="Admin secret"
            style={{ width: '100%', border: '0.5px solid #ccc', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
          />
          <button
            onClick={() => fetchClaims(secret)}
            disabled={loading}
            style={{ width: '100%', background: '#3B6D11', color: '#EAF3DE', border: 'none', padding: '10px', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: '#F7F5F0' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', background: '#fff', borderBottom: '0.5px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 13 }}>
            <IconArrowLeft size={16} /> Home
          </a>
          <span style={{ color: '#ccc' }}>·</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Admin — Claims Review</span>
        </div>
        <div style={{ fontSize: 13, color: '#888' }}>{claims.filter(c => c.status === 'pending').length} pending</div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 16px', borderRadius: 20, border: '0.5px solid #ccc', background: filter === f ? '#3B6D11' : '#fff', color: filter === f ? '#EAF3DE' : '#555', fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
              {f} {f !== 'all' && `(${claims.filter(c => c.status === f).length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888', fontSize: 14 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888', fontSize: 14 }}>No {filter} claims</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(c => (
              <div key={c.id} style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{c.gaushala_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888' }}>
                      <IconMapPin size={12} /> {c.district}, {c.state}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: statusColor(c.status).bg, color: statusColor(c.status).color, textTransform: 'capitalize' }}>
                    {c.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#444' }}>
                    <IconUser size={13} color="#3B6D11" /> {c.contact_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#444' }}>
                    <IconPhone size={13} color="#3B6D11" /> {c.contact_phone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#444' }}>
                    <IconMail size={13} color="#3B6D11" /> {c.contact_email}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    Submitted: {new Date(c.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>

                {c.note && (
                  <div style={{ background: '#F7F5F0', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#555', marginBottom: 12 }}>
                    &ldquo;{c.note}&rdquo;
                  </div>
                )}

                {c.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleAction(c.id, c.gaushala_id, 'approve')}
                      disabled={actionLoading === c.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3B6D11', color: '#EAF3DE', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                    >
                      <IconCheck size={14} /> Approve & verify
                    </button>
                    <button
                      onClick={() => handleAction(c.id, c.gaushala_id, 'reject')}
                      disabled={actionLoading === c.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#CC0000', border: '0.5px solid #FFCCCC', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}
                    >
                      <IconX size={14} /> Reject
                    </button>
                    <a href={`/directory/${c.gaushala_id}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F7F5F0', color: '#555', border: '0.5px solid #e5e5e5', padding: '8px 16px', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
                      View listing
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
