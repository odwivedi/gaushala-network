'use client';
import logger from '@/lib/logger';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  display_name: string;
  trust_level_name: string;
  can_moderate: boolean;
}

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  slug?: string;
  state?: string;
  summary?: string;
  type: string;
}

export default function SiteNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.success && d.user) setUser(d.user as User); })
      .catch(err => logger.error('UI', 'SiteNav.tsx', 'Failed to fetch session', { err: String(err) }));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            const all: SearchResult[] = [];
            d.results.forEach((r: { hits: SearchResult[] }) => all.push(...(r.hits || [])));
            setSearchResults(all.slice(0, 8));
          }
          setSearching(false);
        })
        .catch(() => setSearching(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    logger.info('UI', 'SiteNav.tsx', 'User logged out');
    router.push('/');
  }

  function handleResultClick(result: SearchResult) {
    setSearchOpen(false);
    setSearchQuery('');
    if (result.type === 'article' && result.slug) router.push(`/wiki/${result.slug}`);
    else if (result.type === 'gaushala') router.push(`/directory/${result.id}`);
  }

  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e5e5', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3B6D11', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🐄</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#3B6D11' }}>gaushala.network</span>
        </Link>
      </div>

      {/* Search */}
      <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 360, margin: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f5f5f5', borderRadius: 8, padding: '6px 12px', border: searchOpen ? '1px solid #3B6D11' : '1px solid transparent' }}>
          <span style={{ color: '#888', marginRight: 6, fontSize: 14 }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search gaushalas, breeds, scriptures..."
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, width: '100%', color: '#333' }}
          />
          {searching && <span style={{ color: '#888', fontSize: 12 }}>...</span>}
        </div>
        {searchOpen && searchResults.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: 4, zIndex: 200 }}>
            {searchResults.map((r, i) => (
              <div key={i} onClick={() => handleResultClick(r)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: i < searchResults.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9f9f9')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, background: r.type === 'article' ? '#EAF3DE' : '#FFF3CD', color: r.type === 'article' ? '#3B6D11' : '#856404', borderRadius: 4, padding: '1px 6px' }}>{r.type}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{r.title || r.name}</span>
                </div>
                {(r.summary || r.state) && (
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{r.summary?.slice(0, 80) || r.state}</p>
                )}
              </div>
            ))}
          </div>
        )}
        {searchOpen && searchQuery.trim() && !searching && searchResults.length === 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: 4, padding: '12px 14px', fontSize: 13, color: '#888' }}>
            No results for &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        {['Directory', 'Wiki', 'Contribute', 'Ask'].map(link => (
          <Link key={link} href={`/${link.toLowerCase()}`}
            style={{ fontSize: 13, color: '#555', textDecoration: 'none' }}>{link}</Link>
        ))}
        {user ? (
          <>
            <span style={{ fontSize: 13, color: '#3B6D11', fontWeight: 500 }}>{user.display_name}</span>
            {user.can_moderate && (
              <>
                <Link href="/admin/moderation" style={{ fontSize: 13, color: '#856404', background: '#FFF3CD', padding: '4px 10px', borderRadius: 6, textDecoration: 'none', fontWeight: 500 }}>Moderation</Link>
                <Link href="/admin/contributions" style={{ fontSize: 13, color: '#6b21a8', background: '#f3e8ff', padding: '4px 10px', borderRadius: 6, textDecoration: 'none', fontWeight: 500 }}>Contributions</Link>
              </>
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
