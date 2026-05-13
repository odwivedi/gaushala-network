'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  display_name: string;
  trust_level_name: string;
  can_moderate: boolean;
}

export default function SiteNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.success && d.user) setUser(d.user as User); })
      .catch(err => logger.error('UI', 'SiteNav.tsx', 'Failed to fetch session', { err: String(err) }));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    logger.info('UI', 'SiteNav.tsx', 'User logged out');
    router.push('/');
  }

  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3B6D11', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🐄</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#3B6D11' }}>gaushala.network</span>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {['Directory', 'Map', 'Wiki'].map(link => (
          <Link key={link} href={link === 'Map' ? '/map' : `/${link.toLowerCase()}`}
            style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>{link}</Link>
        ))}

        {user ? (
          <>
            <span style={{ fontSize: 13, color: '#3B6D11', fontWeight: 500 }}>{user.display_name}</span>
            {user.can_moderate && (
              <Link href="/admin/moderation" style={{ fontSize: 13, color: '#856404', background: '#FFF3CD', padding: '4px 10px', borderRadius: 6, textDecoration: 'none', fontWeight: 500 }}>Moderation</Link>
            )}
            <button onClick={handleLogout}
              style={{ fontSize: 13, color: '#666', background: 'none', border: '1px solid #ccc', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>Sign in</Link>
            <Link href="/register" style={{ fontSize: 13, background: '#3B6D11', color: '#fff', padding: '5px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 500 }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
