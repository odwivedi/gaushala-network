'use client';
import { useState, useEffect, useCallback } from 'react';
import { IconSearch, IconMapPin, IconPhone, IconWorld, IconArrowLeft, IconRosetteDiscountCheck, IconPaw } from '@tabler/icons-react';

interface Gaushala {
  id: number;
  name: string;
  state: string;
  district: string;
  address: string;
  phone: string | null;
  website: string | null;
  cow_count: number | null;
  description: string;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  is_claimed: boolean;
  data_source: string;
}

export default function DirectoryPage() {
  const [gaushalas, setGaushalas] = useState<Gaushala[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedState) params.set('state', selectedState);
      params.set('page', String(page));
      params.set('limit', '20');
      const res = await fetch(`/api/directory?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setGaushalas(data.data);
        setTotal(data.total);
        if (data.states.length) setStates(data.states);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, selectedState, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <main style={{ minHeight: '100vh', background: '#F7F5F0' }}>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', background: '#fff', borderBottom: '0.5px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 13 }}>
            <IconArrowLeft size={16} /> Home
          </a>
          <span style={{ color: '#ccc' }}>·</span>
          <div style={{ fontSize: 15, fontWeight: 500 }}>🐄 Gaushala Directory</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ fontSize: 13, color: '#888' }}>{total.toLocaleString()} gaushalas listed</div><a href='/map' style={{ fontSize: 13, background: '#EAF3DE', color: '#3B6D11', padding: '6px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>🗺️ Map view</a></div>
      </nav>

      {/* Search header */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e5e5e5', padding: '24px 32px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>Gaushala Directory</h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Every gaushala in India — search by name, district, or state</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, display: 'flex', border: '0.5px solid #ccc', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
            <span style={{ padding: '0 12px', display: 'flex', alignItems: 'center', color: '#888' }}><IconSearch size={16} /></span>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, district, or address..."
              style={{ flex: 1, border: 'none', padding: '10px 0', fontSize: 14, outline: 'none' }}
            />
          </div>
          <select
            value={selectedState}
            onChange={e => { setSelectedState(e.target.value); setPage(1); }}
            style={{ border: '0.5px solid #ccc', borderRadius: 8, padding: '10px 14px', fontSize: 13, background: '#fff', color: '#333', minWidth: 160 }}
          >
            <option value="">All states</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      <div style={{ padding: '24px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontSize: 14 }}>Loading...</div>
        ) : gaushalas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#888', fontSize: 14 }}>No gaushalas found</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {gaushalas.map(g => (
              <div key={g.id} style={{ background: '#fff', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '18px', position: 'relative' }}>
                {g.is_verified && (
                  <span style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#3B6D11', background: '#EAF3DE', padding: '2px 8px', borderRadius: 20 }}>
                    <IconRosetteDiscountCheck size={12} /> Verified
                  </span>
                )}
                <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', marginBottom: 4, paddingRight: g.is_verified ? 80 : 0 }}>{g.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888', marginBottom: 8 }}>
                  <IconMapPin size={12} /> {g.district}, {g.state}
                </div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 12 }}>{g.description}</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {g.cow_count && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#3B6D11' }}>
                      <IconPaw size={13} /> {g.cow_count.toLocaleString()} cows
                    </span>
                  )}
                  {g.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#555' }}>
                      <IconPhone size={13} /> {g.phone}
                    </span>
                  )}
                  {g.website && (
                    <a href={g.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#3B6D11' }}>
                      <IconWorld size={13} /> Website
                    </a>
                  )}
                </div>
                {!g.is_claimed && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid #f0f0f0' }}>
                    <a href={`/directory/claim/${g.id}`} style={{ fontSize: 12, color: '#3B6D11' }}>Are you the manager? Claim this listing →</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '8px 16px', border: '0.5px solid #ccc', borderRadius: 8, background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#ccc' : '#333', fontSize: 13 }}>
              Previous
            </button>
            <span style={{ padding: '8px 16px', fontSize: 13, color: '#888' }}>
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
              style={{ padding: '8px 16px', border: '0.5px solid #ccc', borderRadius: 8, background: '#fff', cursor: page >= Math.ceil(total / 20) ? 'not-allowed' : 'pointer', color: page >= Math.ceil(total / 20) ? '#ccc' : '#333', fontSize: 13 }}>
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
