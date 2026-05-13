'use client';
import logger from '@/lib/logger';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import * as Diff from 'diff';

const TABS = ['pending', 'approved', 'rejected', 'flags', 'bans', 'users'];

const TRUST_LEVELS = ['registered', 'email_verified', 'contributor', 'verified_expert', 'trusted_editor', 'moderator', 'admin', 'banned'];

interface QueueItem {
  id: number; status: string; created_at: string; review_note: string;
  title: string; slug: string; revision_id: number; edit_summary: string;
  trust_level: string; submitted_by_email: string; submitted_by_name: string; content: string;
}
interface Flag {
  id: number; reason: string; note: string; status: string; created_at: string;
  resolved_at: string; title: string; slug: string; flagged_by_email: string; resolved_by_email: string;
}
interface Ban {
  id: number; ban_type: string; reason: string; ip_address: string; created_at: string;
  expires_at: string; lifted_at: string; lift_note: string;
  user_email: string; user_name: string; banned_by_email: string;
}
interface User {
  id: number; email: string; display_name: string; trust_level: string;
  trust_level_id: number; created_at: string; last_login: string;
  revision_count: number; active_ban_count: number;
}

export default function ModerationPage() {
  const [secret, setSecret] = useState('');
  const [authed, setAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);

  // Queue
  const [items, setItems] = useState<QueueItem[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);

  // Flags
  const [flags, setFlags] = useState<Flag[]>([]);
  const [flagStatus, setFlagStatus] = useState('open');

  // Bans
  const [bans, setBans] = useState<Ban[]>([]);
  const [banForm, setBanForm] = useState({ user_id: '', ip_address: '', ban_type: 'account', reason: '', expires_at: '' });
  const [liftNote, setLiftNote] = useState('');

  // Users
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const headers = { 'x-admin-secret': secret };

  const fetchQueue = useCallback((tab: string) => {
    setLoading(true);
    fetch(`/api/admin/moderation?status=${tab}`, { headers })
      .then(r => r.json()).then(d => { setItems(d.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [secret]);

  const fetchFlags = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/flags?status=${flagStatus}`, { headers })
      .then(r => r.json()).then(d => { setFlags(d.flags || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [secret, flagStatus]);

  const fetchBans = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/bans', { headers })
      .then(r => r.json()).then(d => { setBans(d.bans || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [secret]);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/users', { headers })
      .then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [secret]);

  useEffect(() => {
    if (!authed) return;
    if (['pending', 'approved', 'rejected'].includes(activeTab)) fetchQueue(activeTab);
    else if (activeTab === 'flags') fetchFlags();
    else if (activeTab === 'bans') fetchBans();
    else if (activeTab === 'users') fetchUsers();
  }, [authed, activeTab, fetchQueue, fetchFlags, fetchBans, fetchUsers]);

  useEffect(() => {
    if (authed && activeTab === 'flags') fetchFlags();
  }, [flagStatus]);

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    fetch('/api/admin/moderation?status=pending', { headers: { 'x-admin-secret': secret } })
      .then(r => { if (r.ok) { setAuthed(true); logger.info('UI', 'moderation/page.tsx', 'Admin authed'); } else alert('Wrong secret'); })
      .catch(() => alert('Auth failed'));
  }

  function handleReview(id: number, action: 'approve' | 'reject') {
    setProcessing(id);
    fetch('/api/admin/moderation', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, review_note: reviewNote }) })
      .then(r => r.json()).then(d => {
        if (d.success) { fetchQueue(activeTab); setExpanded(null); setReviewNote(''); }
        else alert('Failed: ' + d.error);
        setProcessing(null);
      });
  }

  function handleFlag(id: number, action: 'resolve' | 'dismiss') {
    fetch('/api/admin/flags', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }) })
      .then(r => r.json()).then(d => { if (d.success) fetchFlags(); else alert('Failed: ' + d.error); });
  }

  function handleBan(e: React.FormEvent) {
    e.preventDefault();
    fetch('/api/admin/bans', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ban', ...banForm, user_id: banForm.user_id ? parseInt(banForm.user_id) : null }) })
      .then(r => r.json()).then(d => {
        if (d.success) { fetchBans(); setBanForm({ user_id: '', ip_address: '', ban_type: 'account', reason: '', expires_at: '' }); }
        else alert('Failed: ' + d.error);
      });
  }

  function handleLift(ban_id: number) {
    fetch('/api/admin/bans', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'lift', ban_id, lift_note: liftNote }) })
      .then(r => r.json()).then(d => { if (d.success) { fetchBans(); setLiftNote(''); } else alert('Failed: ' + d.error); });
  }

  function handleTrustChange(user_id: number, trust_level: string) {
    fetch('/api/admin/users', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, trust_level }) })
      .then(r => r.json()).then(d => { if (d.success) fetchUsers(); else alert('Failed: ' + d.error); });
  }

  const pill = (color: string, text: string) => (
    <span style={{ background: color, color: '#fff', borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{text}</span>
  );

  const trustColor: Record<string, string> = {
    anonymous: '#999', registered: '#888', email_verified: '#4a90d9',
    contributor: '#3B6D11', verified_expert: '#2a5a0a', trusted_editor: '#e67e22',
    moderator: '#8e44ad', admin: '#c0392b', banned: '#333'
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  if (!authed) return (
    <div style={{ maxWidth: 400, margin: '4rem auto', padding: '2rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#3B6D11', marginBottom: '1.5rem' }}>Admin Login</h2>
      <form onSubmit={handleAuth}>
        <input type="password" placeholder="Admin secret" value={secret} onChange={e => setSecret(e.target.value)}
          style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #ccc', marginBottom: '1rem', boxSizing: 'border-box' }} />
        <button type="submit" style={{ width: '100%', padding: '0.6rem', background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          Enter
        </button>
      </form>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#3B6D11', margin: 0 }}>Admin Dashboard</h1>
        <Link href="/wiki" style={{ color: '#3B6D11', fontSize: 14 }}>← Back to Wiki</Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '0.4rem 1rem', borderRadius: 20, border: '1px solid #3B6D11',
              background: activeTab === tab ? '#3B6D11' : '#fff',
              color: activeTab === tab ? '#fff' : '#3B6D11',
              cursor: 'pointer', fontWeight: 500, textTransform: 'capitalize' }}>
            {tab}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#666' }}>Loading...</p>}

      {/* Queue tabs */}
      {['pending', 'approved', 'rejected'].includes(activeTab) && !loading && (
        items.length === 0 ? <p style={{ color: '#666' }}>No {activeTab} items.</p> :
        items.map(item => (
          <div key={item.id} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Link href={'/wiki/' + item.slug} style={{ fontWeight: 600, color: '#3B6D11' }}>{item.title}</Link>
                <span style={{ color: '#666', fontSize: 13, marginLeft: 8 }}>{item.edit_summary}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {pill('#888', item.trust_level)}
                <span style={{ fontSize: 12, color: '#999' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  style={{ padding: '0.3rem 0.8rem', borderRadius: 8, border: '1px solid #3B6D11', background: '#fff', color: '#3B6D11', cursor: 'pointer', fontSize: 13 }}>
                  {expanded === item.id ? 'Hide' : 'Review'}
                </button>
              </div>
            </div>
            {expanded === item.id && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: 13, color: '#666' }}>By: {item.submitted_by_email || 'anonymous'}</p>
                <div style={{ background: '#f9f9f9', borderRadius: 8, padding: '0.75rem', marginBottom: '0.75rem', fontSize: 13, maxHeight: 200, overflowY: 'auto' }}>
                  {Diff.diffWords('', item.content || '').map((part, i) => (
                    <span key={i} style={{ background: part.added ? '#d4edda' : 'transparent', color: part.removed ? '#999' : 'inherit' }}>{part.value}</span>
                  ))}
                </div>
                {activeTab === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input placeholder="Review note (optional)" value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                      style={{ flex: 1, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }} />
                    <button onClick={() => handleReview(item.id, 'approve')} disabled={processing === item.id}
                      style={{ padding: '0.4rem 1rem', background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                      Approve
                    </button>
                    <button onClick={() => handleReview(item.id, 'reject')} disabled={processing === item.id}
                      style={{ padding: '0.4rem 1rem', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* Flags tab */}
      {activeTab === 'flags' && !loading && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
            {['open', 'resolved', 'dismissed'].map(s => (
              <button key={s} onClick={() => setFlagStatus(s)}
                style={{ padding: '0.3rem 0.8rem', borderRadius: 16, border: '1px solid #3B6D11',
                  background: flagStatus === s ? '#3B6D11' : '#fff',
                  color: flagStatus === s ? '#fff' : '#3B6D11', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>
                {s}
              </button>
            ))}
          </div>
          {flags.length === 0 ? <p style={{ color: '#666' }}>No {flagStatus} flags.</p> :
            flags.map(f => (
              <div key={f.id} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Link href={'/wiki/' + f.slug} style={{ fontWeight: 600, color: '#3B6D11' }}>{f.title}</Link>
                    <span style={{ marginLeft: 8 }}>{pill('#e67e22', f.reason)}</span>
                    {f.note && <span style={{ color: '#666', fontSize: 13, marginLeft: 8 }}>{f.note}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#999' }}>{f.flagged_by_email || 'anonymous'}</span>
                    {f.status === 'open' && (
                      <>
                        <button onClick={() => handleFlag(f.id, 'resolve')}
                          style={{ padding: '0.3rem 0.7rem', background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                          Resolve
                        </button>
                        <button onClick={() => handleFlag(f.id, 'dismiss')}
                          style={{ padding: '0.3rem 0.7rem', background: '#999', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Bans tab */}
      {activeTab === 'bans' && !loading && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#3B6D11', marginTop: 0 }}>Add Ban</h3>
            <form onSubmit={handleBan} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="User ID (optional)" value={banForm.user_id} onChange={e => setBanForm({...banForm, user_id: e.target.value})}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }} />
                <input placeholder="IP address (optional)" value={banForm.ip_address} onChange={e => setBanForm({...banForm, ip_address: e.target.value})}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }} />
                <select value={banForm.ban_type} onChange={e => setBanForm({...banForm, ban_type: e.target.value})}
                  style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}>
                  <option value="account">Account</option>
                  <option value="ip">IP</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input placeholder="Reason (required)" value={banForm.reason} onChange={e => setBanForm({...banForm, reason: e.target.value})}
                  style={{ flex: 2, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }} required />
                <input type="date" placeholder="Expires (optional)" value={banForm.expires_at} onChange={e => setBanForm({...banForm, expires_at: e.target.value})}
                  style={{ flex: 1, padding: '0.4rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }} />
                <button type="submit"
                  style={{ padding: '0.4rem 1rem', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  Ban
                </button>
              </div>
            </form>
          </div>
          {bans.length === 0 ? <p style={{ color: '#666' }}>No bans.</p> :
            bans.map(b => (
              <div key={b.id} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{b.user_email || b.ip_address || 'Unknown'}</span>
                    <span style={{ marginLeft: 8 }}>{pill(b.lifted_at ? '#999' : '#c0392b', b.lifted_at ? 'lifted' : b.ban_type)}</span>
                    <span style={{ color: '#666', fontSize: 13, marginLeft: 8 }}>{b.reason}</span>
                  </div>
                  {!b.lifted_at && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input placeholder="Lift note" value={liftNote} onChange={e => setLiftNote(e.target.value)}
                        style={{ padding: '0.3rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 13, width: 140 }} />
                      <button onClick={() => handleLift(b.id)}
                        style={{ padding: '0.3rem 0.7rem', background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                        Lift
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && !loading && (
        <div>
          <input placeholder="Search by email or name..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #ccc', marginBottom: '1rem', boxSizing: 'border-box', fontSize: 14 }} />
          {filteredUsers.length === 0 ? <p style={{ color: '#666' }}>No users found.</p> :
            filteredUsers.map(u => (
              <div key={u.id} style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>{u.display_name || u.email}</span>
                    <span style={{ color: '#999', fontSize: 13, marginLeft: 8 }}>{u.email}</span>
                    <span style={{ marginLeft: 8 }}>{pill(trustColor[u.trust_level] || '#888', u.trust_level)}</span>
                    <span style={{ color: '#999', fontSize: 12, marginLeft: 8 }}>{u.revision_count} edits</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select defaultValue={u.trust_level}
                      onChange={e => handleTrustChange(u.id, e.target.value)}
                      style={{ padding: '0.3rem', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}>
                      {TRUST_LEVELS.map(tl => <option key={tl} value={tl}>{tl}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
