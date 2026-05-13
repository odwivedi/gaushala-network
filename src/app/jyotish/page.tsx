'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import SiteNav from '@/components/SiteNav';

interface Graha {
  id: number;
  name: string;
  name_sanskrit: string;
  name_hindi: string;
  symbol: string;
  cow_association: string;
  significance: string;
  color: string;
  day_of_week: string;
  remedy_count: number;
}

interface Remedy {
  id: number;
  remedy_type: string;
  description: string;
  procedure: string;
  timing: string;
  scripture_basis: string;
  graha_name: string;
}

interface GodaanEntry {
  id: number;
  aspect: string;
  description: string;
  scripture_basis: string;
  procedure: string;
  timing: string;
}

interface MuhurtaEntry {
  id: number;
  occasion: string;
  description: string;
  auspicious_tithis: string;
  auspicious_nakshatras: string;
  auspicious_days: string;
  avoid: string;
  scripture_basis: string;
}

export default function JyotishPage() {
  const [grahas, setGrahas] = useState<Graha[]>([]);
  const [selectedGraha, setSelectedGraha] = useState<Graha | null>(null);
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [godaan, setGodaan] = useState<GodaanEntry[]>([]);
  const [muhurta, setMuhurta] = useState<MuhurtaEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'grahas' | 'godaan' | 'muhurta'>('grahas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jyotish')
      .then(r => r.json())
      .then(d => { if (d.success) setGrahas(d.grahas); })
      .catch(err => logger.error('UI', 'jyotish/page.tsx', 'Grahas fetch failed', { err: String(err) }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'godaan' && godaan.length === 0) {
      fetch('/api/jyotish/godaan')
        .then(r => r.json())
        .then(d => { if (d.success) setGodaan(d.entries); })
        .catch(err => logger.error('UI', 'jyotish/page.tsx', 'Godaan fetch failed', { err: String(err) }));
    }
    if (activeTab === 'muhurta' && muhurta.length === 0) {
      fetch('/api/jyotish/muhurta')
        .then(r => r.json())
        .then(d => { if (d.success) setMuhurta(d.entries); })
        .catch(err => logger.error('UI', 'jyotish/page.tsx', 'Muhurta fetch failed', { err: String(err) }));
    }
  }, [activeTab, godaan.length, muhurta.length]);

  function selectGraha(graha: Graha) {
    setSelectedGraha(graha);
    fetch(`/api/jyotish/grahas?graha_id=${graha.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setRemedies(d.data); })
      .catch(err => logger.error('UI', 'jyotish/page.tsx', 'Remedies fetch failed', { err: String(err) }));
  }

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
        <h1 style={{ color: '#3B6D11', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Jyotish & Remedies</h1>
        <p style={{ color: '#666', marginTop: '0.25rem' }}>The cow in Vedic astrology — grahas, remedies, Go-daan and Muhurta</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button style={tabStyle('grahas')} onClick={() => setActiveTab('grahas')}>Grahas & Remedies</button>
        <button style={tabStyle('godaan')} onClick={() => setActiveTab('godaan')}>Go-daan</button>
        <button style={tabStyle('muhurta')} onClick={() => setActiveTab('muhurta')}>Muhurta</button>
      </div>

      {activeTab === 'grahas' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedGraha ? '280px 1fr' : '1fr', gap: '1.5rem' }}>
          <div>
            {loading ? <p style={{ color: '#666' }}>Loading...</p> :
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {grahas.map(g => (
                  <div key={g.id} onClick={() => selectGraha(g)}
                    style={{ border: `1px solid ${selectedGraha?.id === g.id ? '#3B6D11' : '#e0e0e0'}`, borderRadius: 10, padding: '0.9rem 1rem', background: selectedGraha?.id === g.id ? '#EAF3DE' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '1.6rem', marginRight: '0.5rem', fontFamily: 'serif', lineHeight: 1 }}>{g.symbol}</span>
                        <strong style={{ color: '#3B6D11' }}>{g.name}</strong>
                        <span style={{ color: '#666', fontSize: '0.85rem', marginLeft: '0.4rem' }}>{g.name_sanskrit}</span>
                      </div>
                      {g.day_of_week && <span style={{ fontSize: '0.75rem', color: '#999' }}>{g.day_of_week}</span>}
                    </div>
                    {g.remedy_count > 0 && <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#3B6D11' }}>{g.remedy_count} {Number(g.remedy_count) === 1 ? 'remedy' : 'remedies'}</p>}
                  </div>
                ))}
              </div>
            }
          </div>

          {selectedGraha && (
            <div>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden', marginBottom: '1.25rem' }}>
                <div style={{ background: '#EAF3DE', padding: '1rem 1.25rem' }}>
                  <h2 style={{ margin: 0, color: '#3B6D11', fontSize: '1.3rem' }}>
                    <span style={{ fontSize: '1.6rem', fontFamily: 'serif' }}>{selectedGraha.symbol}</span> {selectedGraha.name} ({selectedGraha.name_sanskrit})
                  </h2>
                  {selectedGraha.color && <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#666' }}>Color: {selectedGraha.color} {selectedGraha.day_of_week && `· Day: ${selectedGraha.day_of_week}`}</p>}
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <p style={{ color: '#444', margin: '0 0 0.75rem', fontSize: '0.95rem' }}><strong>Significance:</strong> {selectedGraha.significance}</p>
                  <p style={{ color: '#444', margin: 0, fontSize: '0.95rem' }}><strong>Cow association:</strong> {selectedGraha.cow_association}</p>
                </div>
              </div>

              {remedies.length > 0 && (
                <div>
                  <h3 style={{ color: '#3B6D11', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Cow-related remedies for {selectedGraha.name}</h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {remedies.map(r => (
                      <div key={r.id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '1rem 1.25rem', background: '#fff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong style={{ color: '#3B6D11', fontSize: '0.95rem' }}>{r.description}</strong>
                          <span style={{ background: '#FAEEDA', color: '#856404', padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.75rem', whiteSpace: 'nowrap' as const }}>{r.remedy_type}</span>
                        </div>
                        {r.procedure && <p style={{ color: '#555', margin: '0 0 0.4rem', fontSize: '0.88rem' }}><strong>Procedure:</strong> {r.procedure}</p>}
                        {r.timing && <p style={{ color: '#555', margin: '0 0 0.4rem', fontSize: '0.88rem' }}><strong>Timing:</strong> {r.timing}</p>}
                        {r.scripture_basis && <p style={{ color: '#777', margin: 0, fontSize: '0.83rem', fontStyle: 'italic' }}>{r.scripture_basis}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {remedies.length === 0 && <p style={{ color: '#999', fontSize: '0.9rem' }}>No remedies documented yet for this graha.</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'godaan' && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {godaan.map(e => (
            <div key={e.id} style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <div style={{ background: '#FAEEDA', padding: '0.75rem 1.25rem' }}>
                <h3 style={{ margin: 0, color: '#3B6D11', fontSize: '1rem', fontWeight: 700 }}>{e.aspect}</h3>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <p style={{ color: '#444', margin: '0 0 0.75rem', fontSize: '0.95rem' }}>{e.description}</p>
                {e.procedure && <p style={{ color: '#555', margin: '0 0 0.5rem', fontSize: '0.88rem' }}><strong>Procedure:</strong> {e.procedure}</p>}
                {e.timing && <p style={{ color: '#555', margin: '0 0 0.5rem', fontSize: '0.88rem' }}><strong>Auspicious timing:</strong> {e.timing}</p>}
                {e.scripture_basis && <p style={{ color: '#777', margin: 0, fontSize: '0.85rem', fontStyle: 'italic' }}>{e.scripture_basis}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'muhurta' && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {muhurta.map(e => (
            <div key={e.id} style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <div style={{ background: '#EAF3DE', padding: '0.75rem 1.25rem' }}>
                <h3 style={{ margin: 0, color: '#3B6D11', fontSize: '1rem', fontWeight: 700 }}>{e.occasion}</h3>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <p style={{ color: '#444', margin: '0 0 0.75rem', fontSize: '0.95rem' }}>{e.description}</p>
                {e.auspicious_tithis && <p style={{ color: '#555', margin: '0 0 0.4rem', fontSize: '0.88rem' }}><strong>Auspicious Tithis:</strong> {e.auspicious_tithis}</p>}
                {e.auspicious_nakshatras && <p style={{ color: '#555', margin: '0 0 0.4rem', fontSize: '0.88rem' }}><strong>Auspicious Nakshatras:</strong> {e.auspicious_nakshatras}</p>}
                {e.auspicious_days && <p style={{ color: '#555', margin: '0 0 0.4rem', fontSize: '0.88rem' }}><strong>Auspicious Days:</strong> {e.auspicious_days}</p>}
                {e.avoid && <p style={{ color: '#c0392b', margin: '0 0 0.4rem', fontSize: '0.88rem' }}><strong>Avoid:</strong> {e.avoid}</p>}
                {e.scripture_basis && <p style={{ color: '#777', margin: 0, fontSize: '0.85rem', fontStyle: 'italic' }}>{e.scripture_basis}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
