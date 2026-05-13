'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import { useParams } from 'next/navigation';
import * as Diff from 'diff';

interface Revision {
  id: number;
  edit_summary: string;
  trust_level: string;
  created_at: string;
  content: string;
}

export default function HistoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);
  const [diff, setDiff] = useState<Diff.Change[]>([]);

  useEffect(() => {
    fetch(`/api/wiki/${slug}/revisions`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setRevisions(d.revisions);
          if (d.revisions.length >= 2) {
            setCompareA(d.revisions[1].id);
            setCompareB(d.revisions[0].id);
          }
        } else {
          setError(d.error);
        }
      })
      .catch(err => {
        logger.error('UI', 'wiki/[slug]/history/page.tsx', 'Fetch failed', { slug, err: String(err) });
        setError('Failed to load revisions');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (compareA === null || compareB === null) return;
    const a = revisions.find(r => r.id === compareA);
    const b = revisions.find(r => r.id === compareB);
    if (!a || !b) return;
    const stripped = (html: string) => html.replace(/<[^>]+>/g, '');
    setDiff(Diff.diffWords(stripped(a.content), stripped(b.content)));
  }, [compareA, compareB, revisions]);

  if (loading) return <div style={{ padding: '2rem', color: '#666' }}>Loading...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#c00' }}>{error}</div>;

  return (
    <><SiteNav />
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href={`/wiki/${slug}`} style={{ color: '#3B6D11', textDecoration: 'none', fontSize: '0.9rem' }}>← Back to article</Link>
      </div>

      <h1 style={{ color: '#3B6D11', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Revision History</h1>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden', marginBottom: '2rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#EAF3DE' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#3B6D11', fontWeight: 600 }}>Compare</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#3B6D11', fontWeight: 600 }}>Edit summary</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#3B6D11', fontWeight: 600 }}>Trust</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#3B6D11', fontWeight: 600 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((rev, i) => (
              <tr key={rev.id} style={{ borderTop: '1px solid #eee', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                <td style={{ padding: '0.65rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: '#555' }}>
                      <input type="radio" name="compareA" checked={compareA === rev.id}
                        onChange={() => setCompareA(rev.id)} style={{ marginRight: 4 }} />
                      From
                    </label>
                    <label style={{ fontSize: '0.8rem', color: '#555' }}>
                      <input type="radio" name="compareB" checked={compareB === rev.id}
                        onChange={() => setCompareB(rev.id)} style={{ marginRight: 4 }} />
                      To
                    </label>
                  </div>
                </td>
                <td style={{ padding: '0.65rem 1rem', color: '#333', fontSize: '0.9rem' }}>{rev.edit_summary}</td>
                <td style={{ padding: '0.65rem 1rem' }}>
                  <span style={{ background: rev.trust_level === 'ai_generated' ? '#FFF3CD' : '#D4EDDA', color: rev.trust_level === 'ai_generated' ? '#856404' : '#155724', padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.78rem' }}>
                    {rev.trust_level === 'ai_generated' ? 'AI' : 'Verified'}
                  </span>
                </td>
                <td style={{ padding: '0.65rem 1rem', color: '#999', fontSize: '0.85rem' }}>{new Date(rev.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {diff.length > 0 && (
        <div>
          <h2 style={{ color: '#3B6D11', fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Diff</h2>
          <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: '#fff', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {diff.map((part, i) => (
              <span key={i} style={{
                background: part.added ? '#D4EDDA' : part.removed ? '#F8D7DA' : 'transparent',
                color: part.added ? '#155724' : part.removed ? '#721C24' : '#333',
                textDecoration: part.removed ? 'line-through' : 'none',
              }}>
                {part.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
