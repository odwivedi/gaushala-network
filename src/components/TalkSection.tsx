'use client';
import logger from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';

interface Thread {
  id: number;
  title: string;
  created_by_name: string;
  message_count: number;
  last_activity: string;
  created_at: string;
}

interface Message {
  id: number;
  content: string;
  display_name: string;
  trust_level_name: string;
  created_at: string;
}

interface TalkSectionProps {
  entity_type: string;
  entity_id: number;
}

export default function TalkSection({ entity_type, entity_id }: TalkSectionProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [user, setUser] = useState<{id: number; display_name: string} | null>(null);

  const loadThreads = useCallback(() => {
    setLoading(true);
    fetch(`/api/community/talk?entity_type=${entity_type}&entity_id=${entity_id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setThreads(d.threads); })
      .catch(err => logger.error('UI', 'TalkSection.tsx', 'Threads fetch failed', { err: String(err) }))
      .finally(() => setLoading(false));
  }, [entity_type, entity_id]);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.success && d.user) setUser(d.user); });
    loadThreads();
  }, [entity_type, entity_id, loadThreads]);

  function loadMessages(thread_id: number) {
    setActiveThread(thread_id);
    fetch(`/api/community/talk?thread_id=${thread_id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setMessages(d.messages); })
      .catch(err => logger.error('UI', 'TalkSection.tsx', 'Messages fetch failed', { err: String(err) }));
  }

  async function postMessage() {
    if (!newMessage.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/community/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread_id: activeThread, content: newMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { ...data.message, display_name: user?.display_name || 'You', trust_level_name: 'registered' }]);
        setNewMessage('');
        loadThreads();
      }
    } catch (err) {
      logger.error('UI', 'TalkSection.tsx', 'Post message failed', { err: String(err) });
    } finally {
      setPosting(false);
    }
  }

  async function startThread() {
    if (!newMessage.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/community/talk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type, entity_id, title: newThreadTitle, content: newMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        setNewThreadTitle('');
        setShowNewThread(false);
        loadThreads();
        loadMessages(data.thread.id);
      }
    } catch (err) {
      logger.error('UI', 'TalkSection.tsx', 'Start thread failed', { err: String(err) });
    } finally {
      setPosting(false);
    }
  }

  const trustColors: Record<string, string> = { registered: '#666', email_verified: '#3B6D11', contributor: '#856404', verified_expert: '#0d6efd', trusted_editor: '#6f42c1', moderator: '#dc3545', admin: '#dc3545' };

  return (
    <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, background: '#fff', marginTop: '1.5rem', overflow: 'hidden' }}>
      <div style={{ background: '#EAF3DE', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#3B6D11', fontSize: '1rem' }}>Discussion ({threads.length})</h3>
        {user && !activeThread && (
          <button onClick={() => setShowNewThread(!showNewThread)}
            style={{ background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            + New thread
          </button>
        )}
        {activeThread && (
          <button onClick={() => { setActiveThread(null); setMessages([]); }}
            style={{ background: 'none', color: '#3B6D11', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← All threads
          </button>
        )}
      </div>

      <div style={{ padding: '1rem 1.25rem' }}>
        {!activeThread ? (
          <>
            {showNewThread && user && (
              <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: '1rem', marginBottom: '1rem', background: '#FAFAFA' }}>
                <input value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)}
                  placeholder="Thread title (optional)"
                  style={{ width: '100%', padding: '0.6rem 0.9rem', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', marginBottom: '0.5rem', boxSizing: 'border-box' }} />
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Start the discussion..."
                  rows={3}
                  style={{ width: '100%', padding: '0.6rem 0.9rem', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box', marginBottom: '0.5rem' }} />
                <button onClick={startThread} disabled={posting}
                  style={{ background: posting ? '#999' : '#3B6D11', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: posting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                  {posting ? 'Posting...' : 'Start thread'}
                </button>
              </div>
            )}

            {loading ? <p style={{ color: '#666', fontSize: '0.9rem' }}>Loading...</p> :
              threads.length === 0 ? (
                <p style={{ color: '#999', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>
                  No discussions yet. {user ? 'Start the first thread.' : <><a href="/login" style={{ color: '#3B6D11' }}>Sign in</a> to start a discussion.</>}
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {threads.map(t => (
                    <div key={t.id} onClick={() => loadMessages(t.id)}
                      style={{ padding: '0.75rem 1rem', border: '1px solid #eee', borderRadius: 8, cursor: 'pointer', background: '#FAFAFA', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#EAF3DE')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#FAFAFA')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: '#3B6D11', fontSize: '0.9rem' }}>{t.title || 'Discussion'}</p>
                        <span style={{ color: '#999', fontSize: '0.78rem' }}>{t.message_count} {Number(t.message_count) === 1 ? 'reply' : 'replies'}</span>
                      </div>
                      <p style={{ margin: '0.2rem 0 0', color: '#888', fontSize: '0.78rem' }}>
                        Started by {t.created_by_name || 'Anonymous'} · {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )
            }
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem', maxHeight: 400, overflowY: 'auto' }}>
              {messages.map(m => (
                <div key={m.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: trustColors[m.trust_level_name] || '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                    {(m.display_name || 'A')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 600, color: '#333', fontSize: '0.85rem' }}>{m.display_name || 'Anonymous'}</span>
                      <span style={{ color: '#bbb', fontSize: '0.75rem' }}>{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: 0, color: '#444', fontSize: '0.9rem', lineHeight: 1.6 }}>{m.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {user ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
                <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  style={{ flex: 1, padding: '0.6rem 0.9rem', border: '1px solid #ccc', borderRadius: 6, fontSize: '0.9rem', resize: 'none', boxSizing: 'border-box' }} />
                <button onClick={postMessage} disabled={posting}
                  style={{ background: posting ? '#999' : '#3B6D11', color: '#fff', border: 'none', borderRadius: 6, padding: '0.6rem 1rem', cursor: posting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                  {posting ? '...' : 'Reply'}
                </button>
              </div>
            ) : (
              <p style={{ color: '#999', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.75rem' }}>
                <a href="/login" style={{ color: '#3B6D11' }}>Sign in</a> to reply
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
