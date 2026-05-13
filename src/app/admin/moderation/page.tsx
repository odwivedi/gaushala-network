'use client';
import logger from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import * as Diff from 'diff';

interface QueueItem {
  id: number;
  status: string;
  created_at: string;
  review_note: string;
  title: string;
  slug: string;
  revision_id: number;
  edit_summary: string;
  trust_level: string;
  submitted_by_email: string;
  submitted_by_name: string;
  content: string;
}

export default function ModerationPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);

  const fetchQueue = useCallback((tab: string) => {
    if (!authed) return;
    setLoading(true);
    fetch(`/api/admin/moderation?status=${tab}`, {
      headers: { 'x-admin-secret': secret }
    })
      .then(r => r.json())
      .then(d => { if (d.success) setItems(d.items); })
      .catch(err => logger.error('UI', 'admin/moderation/page.tsx', 'Fetch failed', { err: String(err) }))
      .finally(() => setLoading(false));
  }, [secret, authed]);

  useEffect(() => { if (authed) fetchQueue(activeTab); }, [authed, activeTab, fetchQueue]);

  async function handleAction(id: number, action: 'approve' | 'reject') {
    setProcessing(id);
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': secret },
        body: JSON.stringify({ id, action, review_note: reviewNote }),
      });
      const data = await res.json();
      if (data.success) {
        setItems(prev => prev.filter(i => i.id !== id));
        setExpanded(null);
        setReviewNote('');
        logger.info('UI', 'admin/moderation/page.tsx', 'Action taken', { id, action });
      }
    } catch (err) {
      logger.error('UI', 'admin/moderation/page.tsx', 'Action failed', { err: String(err) });
    } finally {
      setProcessing(null);
    }
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 360, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
          <h1 style={{ color: '#3B6D11', fontWeight: 700, marginBottom: '1rem' }}>Moderation Queue</h1>
          <input type="password" placeholder="Admin secret" value={secret} onChange={e => setSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setAuthed(true)}
            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
          <button onClick={() => setAuthed(true)}
            style={{ width: '100%', background: '#3B6D11', color: '#fff', padding: '0.7rem', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#3B6D11', fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Moderation Queue</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="/admin/claims" style={{ color: '#3B6D11', fontSize: '0.9rem', padding: '0.4rem 0.8rem', border: '1px solid #3B6D11', borderRadius: 6, textDecoration: 'none' }}>Claims</Link>
          <Link href="/wiki" style={{ color: '#666', fontSize: '0.9rem' }}>← Wiki</Link>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['pending', 'approved', 'rejected'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '0.4rem 1rem', borderRadius: 20, border: '1px solid #3B6D11', background: activeTab === tab ? '#3B6D11' : '#fff', color: activeTab === tab ? '#fff' : '#3B6D11', cursor: 'pointer', fontWeight: 500, textTransform: 'capitalize' }}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: '#666' }}>Loading...</p> :
        items.length === 0 ? <p style={{ color: '#666' }}>No {activeTab} items.</p> :
        <div style={{ display: 'grid', gap: '1rem' }}>
          {items.map(item => (
            <div key={item.id} style={{ border: '1px solid #e0e0e0', borderRadius: 10, background: '#fff', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#3B6D11', fontSize: '1rem' }}>{item.title}</h3>
                  <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.85rem' }}>
                    {item.edit_summary} · by {item.submitted_by_name || item.submitted_by_email || 'Anonymous'} · {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  style={{ background: '#EAF3DE', color: '#3B6D11', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {expanded === item.id ? 'Hide' : 'Review'}
                </button>
              </div>

              {expanded === item.id && (
                <div style={{ borderTop: '1px solid #eee', padding: '1.25rem' }}>
                  <div style={{ background: '#FAFAFA', borderRadius: 8, padding: '1rem', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.7, maxHeight: 300, overflowY: 'auto' }}>
                    {(() => {
                      const diff = Diff.diffWords('', item.content.replace(/<[^>]+>/g, ''));
                      return diff.map((part, i) => (
                        <span key={i} style={{ background: part.added ? '#D4EDDA' : 'transparent', color: part.added ? '#155724' : '#333' }}>
                          {part.value}
                        </span>
                      ));
                    })()}
                  </div>

                  {activeTab === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Review note (optional)</label>
                        <input value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                          placeholder="Reason for approval or rejection"
                          style={{ width: '100%', padding: '0.6rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' }} />
                      </div>
                      <button onClick={() => handleAction(item.id, 'approve')} disabled={processing === item.id}
                        style={{ background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ✓ Approve
                      </button>
                      <button onClick={() => handleAction(item.id, 'reject')} disabled={processing === item.id}
                        style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.25rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {item.review_note && (
                    <p style={{ margin: '0.75rem 0 0', color: '#666', fontSize: '0.85rem' }}>Note: {item.review_note}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  );
}
