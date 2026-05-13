'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import SiteNav from '@/components/SiteNav';

interface ScriptureRef {
  id: number;
  source_id: number;
  chapter: string;
  verse: string;
  shloka: string;
  transliteration: string;
  meaning_hindi: string;
  meaning_english: string;
  context: string;
  significance: string;
  trust_level: string;
  source_name: string;
  source_sanskrit: string;
  source_category: string;
}

interface Source {
  id: number;
  name: string;
  name_sanskrit: string;
  category: string;
  description: string;
  ref_count: number;
}

export default function ScripturePage() {
  const [refs, setRefs] = useState<ScriptureRef[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [activeSource, setActiveSource] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shlokas' | 'panchagavya'>('shlokas');

  useEffect(() => {
    fetch('/api/scripture/sources')
      .then(r => r.json())
      .then(d => { if (d.success) setSources(d.sources); })
      .catch(err => logger.error('UI', 'scripture/page.tsx', 'Sources fetch failed', { err: String(err) }));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeSource) params.set('source_id', String(activeSource));
    if (search) params.set('search', search);
    fetch(`/api/scripture?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setRefs(d.refs); })
      .catch(err => logger.error('UI', 'scripture/page.tsx', 'Refs fetch failed', { err: String(err) }))
      .finally(() => setLoading(false));
  }, [activeSource, search]);

  return (
    <>
    <SiteNav />
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#3B6D11', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Scriptural & Religious</h1>
        <p style={{ color: '#666', marginTop: '0.25rem' }}>The cow in Indian scripture, Ayurveda and tradition</p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['shlokas', 'panchagavya'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 20, border: '1px solid #3B6D11', background: activeTab === tab ? '#3B6D11' : '#fff', color: activeTab === tab ? '#fff' : '#3B6D11', cursor: 'pointer', fontWeight: 500, textTransform: 'capitalize' }}>
            {tab === 'shlokas' ? 'Shlokas & References' : 'Panchagavya'}
          </button>
        ))}
      </div>

      {activeTab === 'shlokas' && (
        <>
          <input type="text" placeholder="Search shlokas, meanings, context..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', marginBottom: '1rem', boxSizing: 'border-box' }} />

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <button onClick={() => setActiveSource(null)}
              style={{ padding: '0.35rem 0.9rem', borderRadius: 16, border: '1px solid #3B6D11', background: activeSource === null ? '#3B6D11' : '#fff', color: activeSource === null ? '#fff' : '#3B6D11', cursor: 'pointer', fontSize: '0.85rem' }}>
              All Sources
            </button>
            {sources.map(s => (
              <button key={s.id} onClick={() => setActiveSource(s.id)}
                style={{ padding: '0.35rem 0.9rem', borderRadius: 16, border: '1px solid #3B6D11', background: activeSource === s.id ? '#3B6D11' : '#fff', color: activeSource === s.id ? '#fff' : '#3B6D11', cursor: 'pointer', fontSize: '0.85rem' }}>
                {s.name} ({s.ref_count})
              </button>
            ))}
          </div>

          {loading ? <p style={{ color: '#666' }}>Loading...</p> :
            refs.length === 0 ? <p style={{ color: '#666' }}>No references found.</p> :
            <div style={{ display: 'grid', gap: '1.25rem' }}>
              {refs.map(ref => (
                <div key={ref.id} style={{ border: '1px solid #e0e0e0', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
                  <div style={{ background: '#EAF3DE', padding: '0.6rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#3B6D11', fontWeight: 600, fontSize: '0.9rem' }}>{ref.source_name} {ref.source_sanskrit && `(${ref.source_sanskrit})`} {ref.chapter && `— Chapter ${ref.chapter}`}{ref.verse && `, Verse ${ref.verse}`}</span>
                    <span style={{ background: ref.trust_level === 'ai_generated' ? '#FFF3CD' : '#D4EDDA', color: ref.trust_level === 'ai_generated' ? '#856404' : '#155724', padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.75rem' }}>
                      {ref.trust_level === 'ai_generated' ? 'AI Generated' : 'Verified'}
                    </span>
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    {ref.shloka && (
                      <p style={{ fontFamily: 'serif', fontSize: '1.2rem', color: '#222', lineHeight: 1.8, margin: '0 0 0.5rem', borderLeft: '3px solid #3B6D11', paddingLeft: '1rem' }}>{ref.shloka}</p>
                    )}
                    {ref.transliteration && (
                      <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', margin: '0 0 0.75rem', paddingLeft: '1rem' }}>{ref.transliteration}</p>
                    )}
                    {ref.meaning_hindi && (
                      <p style={{ fontSize: '0.95rem', color: '#444', margin: '0 0 0.4rem' }}><strong>हिंदी:</strong> {ref.meaning_hindi}</p>
                    )}
                    {ref.meaning_english && (
                      <p style={{ fontSize: '0.95rem', color: '#444', margin: '0 0 0.75rem' }}><strong>English:</strong> {ref.meaning_english}</p>
                    )}
                    {ref.context && (
                      <p style={{ fontSize: '0.88rem', color: '#666', margin: '0 0 0.4rem', borderTop: '1px solid #f0f0f0', paddingTop: '0.75rem' }}><strong>Context:</strong> {ref.context}</p>
                    )}
                    {ref.significance && (
                      <p style={{ fontSize: '0.88rem', color: '#555', margin: '0.4rem 0 0' }}><strong>Significance:</strong> {ref.significance}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          }
        </>
      )}

      {activeTab === 'panchagavya' && <PanchagavyaTab />}
    </div>
    </>
  );
}

function PanchagavyaTab() {
  const [entries, setEntries] = useState<{id:number;name:string;name_sanskrit:string;description:string;ayurvedic_properties:string;traditional_uses:string;scripture_refs:string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scripture/panchagavya')
      .then(r => r.json())
      .then(d => { if (d.success) setEntries(d.entries); })
      .catch(err => logger.error('UI', 'scripture/page.tsx', 'Panchagavya fetch failed', { err: String(err) }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ color: '#666' }}>Loading...</p>;

  return (
    <div>
      <p style={{ color: '#555', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Panchagavya — the five sacred products of the cow: milk, ghee, curd, gomutra, and gomay. Used in Ayurveda, ritual purification, and traditional agriculture for millennia.
      </p>
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {entries.map(e => (
          <div key={e.id} style={{ border: '1px solid #e0e0e0', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
            <div style={{ background: '#FAEEDA', padding: '0.75rem 1.25rem' }}>
              <h3 style={{ margin: 0, color: '#3B6D11', fontSize: '1.1rem', fontWeight: 700 }}>{e.name} <span style={{ fontSize: '1rem', color: '#666', fontWeight: 400 }}>({e.name_sanskrit})</span></h3>
            </div>
            <div style={{ padding: '1.25rem' }}>
              <p style={{ color: '#444', margin: '0 0 0.75rem', fontSize: '0.95rem' }}>{e.description}</p>
              <p style={{ color: '#555', margin: '0 0 0.5rem', fontSize: '0.88rem' }}><strong>Ayurvedic properties:</strong> {e.ayurvedic_properties}</p>
              <p style={{ color: '#555', margin: '0 0 0.5rem', fontSize: '0.88rem' }}><strong>Traditional uses:</strong> {e.traditional_uses}</p>
              {e.scripture_refs && <p style={{ color: '#777', margin: '0', fontSize: '0.85rem', fontStyle: 'italic' }}>{e.scripture_refs}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
