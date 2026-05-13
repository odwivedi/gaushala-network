'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SiteNav from '@/components/SiteNav';

interface Profile {
  id: number;
  display_name: string;
  created_at: string;
  trust_level_name: string;
  trust_rank: number;
  bio: string;
  expertise: string;
  organisation: string;
  website: string;
  avatar_url: string;
  location: string;
  contribution_count: number;
}

interface CurrentUser {
  id: number;
  display_name: string;
}

const trustLabels: Record<string, string> = {
  registered: 'Member', email_verified: 'Verified Member',
  contributor: 'Contributor', verified_expert: 'Verified Expert',
  trusted_editor: 'Trusted Editor', moderator: 'Moderator', admin: 'Admin',
};

const trustColors: Record<string, string> = {
  registered: '#666', email_verified: '#3B6D11', contributor: '#856404',
  verified_expert: '#0d6efd', trusted_editor: '#6f42c1', moderator: '#dc3545', admin: '#dc3545',
};

function Avatar({ name, avatar_url, size = 80 }: { name: string; avatar_url?: string; size?: number }) {
  if (avatar_url) return <img src={avatar_url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#3B6D11', '#856404', '#0d6efd', '#6f42c1', '#dc3545'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.35 }}>{initials}</div>;
}

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: '', expertise: '', organisation: '', website: '', location: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.success && d.user) setCurrentUser(d.user); });

    fetch(`/api/community/profile?user_id=${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProfile(d.profile);
          setForm({ bio: d.profile.bio || '', expertise: d.profile.expertise || '', organisation: d.profile.organisation || '', website: d.profile.website || '', location: d.profile.location || '', avatar_url: d.profile.avatar_url || '' });
        } else { setError(d.error); }
      })
      .catch(err => { logger.error('UI', 'community/members/[id]/page.tsx', 'Fetch failed', { err: String(err) }); setError('Failed to load profile'); })
      .finally(() => setLoading(false));
  }, [id]);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch('/api/community/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => prev ? { ...prev, ...form } : prev);
        setEditing(false);
        logger.info('UI', 'community/members/[id]/page.tsx', 'Profile saved');
      }
    } catch (err) {
      logger.error('UI', 'community/members/[id]/page.tsx', 'Save failed', { err: String(err) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <><SiteNav /><div style={{ padding: '2rem', color: '#666' }}>Loading...</div></>;
  if (error) return <><SiteNav /><div style={{ padding: '2rem', color: '#c00' }}>{error}</div></>;
  if (!profile) return null;

  const isOwn = currentUser?.id === profile.id;
  const inputStyle = { width: '100%', padding: '0.6rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box' as const };

  return (
    <>
    <SiteNav />
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/community/members" style={{ color: '#3B6D11', textDecoration: 'none', fontSize: '0.9rem' }}>← Members</Link>
      </div>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden', background: '#fff', marginBottom: '1.5rem' }}>
        <div style={{ background: '#EAF3DE', padding: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
          <Avatar name={profile.display_name} avatar_url={profile.avatar_url} size={72} />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, color: '#3B6D11', fontSize: '1.5rem', fontWeight: 700 }}>{profile.display_name}</h1>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: trustColors[profile.trust_level_name] || '#666' }}>
              {trustLabels[profile.trust_level_name] || profile.trust_level_name}
            </span>
            <p style={{ margin: '0.4rem 0 0', color: '#666', fontSize: '0.85rem' }}>
              Member since {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              {profile.contribution_count > 0 && ` · ${profile.contribution_count} contributions`}
            </p>
          </div>
          {isOwn && !editing && (
            <button onClick={() => setEditing(true)}
              style={{ background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' as const }}>
              Edit profile
            </button>
          )}
        </div>

        <div style={{ padding: '1.5rem' }}>
          {editing ? (
            <div style={{ display: 'grid', gap: '0.9rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem', color: '#333' }}>Avatar URL</label>
                <input style={inputStyle} placeholder="https://..." value={form.avatar_url} onChange={e => setForm(p => ({...p, avatar_url: e.target.value}))} />
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: '#999' }}>Link to a public image (JPG, PNG). Use a service like imgur.com to host your photo.</p>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem', color: '#333' }}>Bio</label>
                <textarea style={{...inputStyle, resize: 'vertical' as const}} rows={3} value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem', color: '#333' }}>Expertise</label>
                  <input style={inputStyle} value={form.expertise} onChange={e => setForm(p => ({...p, expertise: e.target.value}))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem', color: '#333' }}>Organisation</label>
                  <input style={inputStyle} value={form.organisation} onChange={e => setForm(p => ({...p, organisation: e.target.value}))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem', color: '#333' }}>Location</label>
                  <input style={inputStyle} placeholder="City, State" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', fontSize: '0.85rem', color: '#333' }}>Website</label>
                  <input style={inputStyle} placeholder="https://..." value={form.website} onChange={e => setForm(p => ({...p, website: e.target.value}))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={saveProfile} disabled={saving}
                  style={{ background: saving ? '#999' : '#3B6D11', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)}
                  style={{ background: '#fff', color: '#666', border: '1px solid #ccc', borderRadius: 8, padding: '0.6rem 1.25rem', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {profile.bio && <p style={{ color: '#444', margin: '0 0 1rem', fontSize: '0.95rem', lineHeight: 1.7 }}>{profile.bio}</p>}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {profile.expertise && <p style={{ margin: 0, color: '#555', fontSize: '0.88rem' }}><strong>Expertise:</strong> {profile.expertise}</p>}
                {profile.organisation && <p style={{ margin: 0, color: '#555', fontSize: '0.88rem' }}><strong>Organisation:</strong> {profile.organisation}</p>}
                {profile.location && <p style={{ margin: 0, color: '#555', fontSize: '0.88rem' }}><strong>Location:</strong> {profile.location}</p>}
                {profile.website && <p style={{ margin: 0, fontSize: '0.88rem' }}><a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3B6D11' }}>{profile.website}</a></p>}
              </div>
              {!profile.bio && !profile.expertise && !profile.location && (
                <p style={{ color: '#999', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  {isOwn ? 'Your profile is empty. Click Edit profile to add your bio and details.' : 'This member has not added a bio yet.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
