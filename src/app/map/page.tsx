'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { IconArrowLeft, IconMapPin, IconSearch } from '@tabler/icons-react';

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

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
  latitude: number;
  longitude: number;
  is_verified: boolean;
}

export default function MapPage() {
  const [gaushalas, setGaushalas] = useState<Gaushala[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Gaushala | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/directory?limit=200')
      .then(r => r.json())
      .then(data => {
        if (data.success) setGaushalas(data.data);
        setLoading(false);
      });
  }, []);

  const filtered = gaushalas.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.state.toLowerCase().includes(search.toLowerCase()) ||
    g.district.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#fff', borderBottom: '0.5px solid #e5e5e5', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 13 }}>
            <IconArrowLeft size={16} /> Home
          </a>
          <span style={{ color: '#ccc' }}>·</span>
          <a href="/directory" style={{ fontSize: 13, color: '#555' }}>Directory</a>
          <span style={{ color: '#ccc' }}>·</span>
          <span style={{ fontSize: 14, fontWeight: 500 }}>🗺️ Map View</span>
        </div>
        <div style={{ fontSize: 13, color: '#888' }}>{gaushalas.length} gaushalas on map</div>
      </nav>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: 300, background: '#fff', borderRight: '0.5px solid #e5e5e5', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '12px', borderBottom: '0.5px solid #e5e5e5' }}>
            <div style={{ display: 'flex', border: '0.5px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '0 10px', display: 'flex', alignItems: 'center', color: '#888' }}><IconSearch size={14} /></span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search gaushalas..."
                style={{ flex: 1, border: 'none', padding: '9px 0', fontSize: 13, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {selected && (
              <div style={{ padding: '14px', background: '#EAF3DE', borderBottom: '0.5px solid #C0DD97' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#173404', marginBottom: 4 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: '#3B6D11', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconMapPin size={12} /> {selected.district}, {selected.state}
                </div>
                <div style={{ fontSize: 12, color: '#27500A', lineHeight: 1.5, marginBottom: 8 }}>{selected.description}</div>
                {selected.cow_count && <div style={{ fontSize: 12, color: '#3B6D11' }}>🐄 {selected.cow_count.toLocaleString()} cows</div>}
                {selected.website && <a href={selected.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#3B6D11', display: 'block', marginTop: 4 }}>🌐 Website</a>}
                <button onClick={() => setSelected(null)} style={{ marginTop: 8, fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Clear ×</button>
              </div>
            )}

            {filtered.map(g => (
              <div
                key={g.id}
                onClick={() => setSelected(g)}
                style={{ padding: '11px 14px', borderBottom: '0.5px solid #f0f0f0', cursor: 'pointer', background: selected?.id === g.id ? '#F5FAF0' : '#fff' }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 2 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IconMapPin size={10} /> {g.district}, {g.state}
                  {g.is_verified && <span style={{ background: '#EAF3DE', color: '#3B6D11', padding: '1px 6px', borderRadius: 10, marginLeft: 4 }}>Verified</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loading ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0', fontSize: 14, color: '#888' }}>
              Loading map...
            </div>
          ) : (
            <MapComponent gaushalas={gaushalas} onSelect={(g) => setSelected(g as Gaushala)} selected={selected} />
          )}
        </div>
      </div>
    </main>
  );
}
