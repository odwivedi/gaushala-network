'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

interface Member {
  id: number;
  display_name: string;
  created_at: string;
  trust_level_name: string;
  trust_rank: number;
  bio: string;
  expertise: string;
  organisation: string;
  avatar_url: string;
  location: string;
  contribution_count: number;
}

const trustColors: Record<string, string> = {
  anonymous: '#999',
  registered: '#666',
  email_verified: '#3B6D11',
  contributor: '#856404',
  verified_expert: '#0d6efd',
  trusted_editor: '#6f42c1',
  moderator: '#dc3545',
  admin: '#dc3545',
};

const trustLabels: Record<string, string> = {
  registered: 'Member',
  email_verified: 'Verified',
  contributor: 'Contributor',
  verified_expert: 'Expert',
  trusted_editor: 'Trusted Editor',
  moderator: 'Moderator',
  admin: 'Admin',
};

function Avatar({ name, avatar_url, size = 48 }: { name: string; avatar_url?: string; size?: number }) {
  if (avatar_url) {
    return <img src={avatar_url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
  }
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#3B6D11', '#856404', '#0d6efd', '#6f42c1', '#dc3545', '#198754'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: size * 0.35 }}>
      {initials}
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/community/profile')
      .then(r => r.json())
      .then(d => { if (d.success) setMembers(d.members); })
      .catch(err => logger.error('UI', 'community/members/page.tsx', 'Fetch failed', { err: String(err) }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter(m =>
    m.display_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.expertise || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.location || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
    <SiteNav />
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#3B6D11', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Members</h1>
          <p style={{ color: '#666', marginTop: '0.25rem' }}>{members.length} members of the gaushala.network community</p>
        </div>
        <Link href="/community" style={{ color: '#3B6D11', fontSize: '0.9rem', textDecoration: 'none' }}>← Community</Link>
      </div>

      <input type="text" placeholder="Search by name, expertise, or location..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', marginBottom: '1.5rem', boxSizing: 'border-box' }} />

      {loading ? <p style={{ color: '#666' }}>Loading...</p> :
        filtered.length === 0 ? <p style={{ color: '#999' }}>No members found.</p> :
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtered.map(m => (
            <Link key={m.id} href={`/community/members/${m.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, padding: '1.25rem', background: '#fff', transition: 'box-shadow 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(59,109,17,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <Avatar name={m.display_name} avatar_url={m.avatar_url} size={48} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#222', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.display_name}</p>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: trustColors[m.trust_level_name] || '#666' }}>
                      {trustLabels[m.trust_level_name] || m.trust_level_name}
                    </span>
                  </div>
                  {m.contribution_count > 0 && (
                    <span style={{ background: '#EAF3DE', color: '#3B6D11', padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {m.contribution_count} edits
                    </span>
                  )}
                </div>
                {m.expertise && <p style={{ margin: '0 0 0.3rem', color: '#856404', fontSize: '0.83rem', fontWeight: 500 }}>{m.expertise}</p>}
                {m.organisation && <p style={{ margin: '0 0 0.3rem', color: '#555', fontSize: '0.83rem' }}>{m.organisation}</p>}
                {m.location && <p style={{ margin: '0 0 0.3rem', color: '#888', fontSize: '0.8rem' }}>📍 {m.location}</p>}
                {m.bio && <p style={{ margin: '0.4rem 0 0', color: '#666', fontSize: '0.83rem', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>{m.bio}</p>}
                <p style={{ margin: '0.5rem 0 0', color: '#bbb', fontSize: '0.75rem' }}>Joined {new Date(m.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>
              </div>
            </Link>
          ))}
        </div>
      }
    </div>
    </>
  );
}
