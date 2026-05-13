'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import SiteNav from '@/components/SiteNav';

interface Festival {
  id: number;
  name: string;
  name_local: string;
  region: string;
  states: string;
  date_description: string;
  significance: string;
  rituals: string;
  cow_role: string;
}

interface Tradition {
  id: number;
  state: string;
  region: string;
  tradition_name: string;
  description: string;
  cow_role: string;
}

export default function CulturePage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [traditions, setTraditions] = useState<Tradition[]>([]);
  const [activeTab, setActiveTab] = useState<'festivals' | 'traditions'>('festivals');
  const [loading, setLoading] = useState(true);
  const [expandedFestival, setExpandedFestival] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/culture?type=${activeTab}`)
      .then(r => r.json())
      .then(d => { if (d.success) { if (activeTab === 'festivals') { setFestivals(d.data); } else { setTraditions(d.data); } } })
      .catch(err => logger.error('UI', 'culture/page.tsx', 'Fetch failed', { err: String(err) }))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const tabStyle = (tab: string) => ({
    padding: '0.5rem 1.25rem', borderRadius: 20, border: '1px solid #3B6D11',
    background: activeTab === tab ? '#3B6D11' : '#fff',
    color: activeTab === tab ? '#fff' : '#3B6D11',
    cursor: 'pointer' as const, fontWeight: 500,
  });

  return (
    <>
    <SiteNav />
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#3B6D11', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Cultural Layer</h1>
        <p style={{ color: '#666', marginTop: '0.25rem' }}>The cow across Indian festivals, art, and regional tradition</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button style={tabStyle('festivals')} onClick={() => setActiveTab('festivals')}>Festivals</button>
        <button style={tabStyle('traditions')} onClick={() => setActiveTab('traditions')}>Regional Traditions</button>
      </div>

      {loading ? <p style={{ color: '#666' }}>Loading...</p> : (
        <>
          {activeTab === 'festivals' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {festivals.map(f => (
                <div key={f.id} style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                  <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', background: expandedFestival === f.id ? '#EAF3DE' : '#fff' }}
                    onClick={() => setExpandedFestival(expandedFestival === f.id ? null : f.id)}>
                    <div>
                      <h3 style={{ margin: 0, color: '#3B6D11', fontSize: '1.1rem', fontWeight: 700 }}>
                        {f.name} {f.name_local && <span style={{ fontSize: '0.95rem', color: '#666', fontWeight: 400 }}>({f.name_local})</span>}
                      </h3>
                      <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#666' }}>
                        {f.region} · {f.date_description}
                      </p>
                    </div>
                    <span style={{ color: '#3B6D11', fontSize: '1.2rem' }}>{expandedFestival === f.id ? '▲' : '▼'}</span>
                  </div>

                  {expandedFestival === f.id && (
                    <div style={{ padding: '1.25rem', borderTop: '1px solid #e0e0e0' }}>
                      <p style={{ color: '#444', margin: '0 0 0.75rem', fontSize: '0.95rem' }}>{f.significance}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: '#FAFAFA', borderRadius: 8, padding: '0.9rem' }}>
                          <p style={{ color: '#3B6D11', fontWeight: 600, margin: '0 0 0.4rem', fontSize: '0.88rem' }}>Rituals</p>
                          <p style={{ color: '#555', margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>{f.rituals}</p>
                        </div>
                        <div style={{ background: '#EAF3DE', borderRadius: 8, padding: '0.9rem' }}>
                          <p style={{ color: '#3B6D11', fontWeight: 600, margin: '0 0 0.4rem', fontSize: '0.88rem' }}>Role of the Cow</p>
                          <p style={{ color: '#555', margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>{f.cow_role}</p>
                        </div>
                      </div>
                      {f.states && (
                        <p style={{ color: '#888', margin: '0.75rem 0 0', fontSize: '0.82rem' }}>Celebrated in: {f.states}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'traditions' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {traditions.map(t => (
                <div key={t.id} style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                  <div style={{ background: '#FAEEDA', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#3B6D11', fontSize: '1rem', fontWeight: 700 }}>{t.tradition_name}</h3>
                      <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: '#666' }}>{t.state}{t.region ? ` — ${t.region}` : ''}</p>
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <p style={{ color: '#444', margin: '0 0 0.75rem', fontSize: '0.95rem', lineHeight: 1.7 }}>{t.description}</p>
                    {t.cow_role && (
                      <p style={{ color: '#3B6D11', margin: 0, fontSize: '0.88rem', fontStyle: 'italic', borderLeft: '3px solid #3B6D11', paddingLeft: '0.75rem' }}>{t.cow_role}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
