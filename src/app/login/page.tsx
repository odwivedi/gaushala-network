'use client';
import logger from '@/lib/logger';
import { useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email || !password) { setError('Please enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        logger.info('UI', 'login/page.tsx', 'Login successful', { email });
        router.push('/wiki');
      } else {
        setError(data.error);
      }
    } catch (err) {
      logger.error('UI', 'login/page.tsx', 'Login failed', { err: String(err) });
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <><SiteNav />
    <div style={{ minHeight: '100vh', background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 420, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h1 style={{ color: '#3B6D11', fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Sign in</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          New here? <Link href="/register" style={{ color: '#3B6D11', fontWeight: 600 }}>Create an account</Link>
        </p>

        {error && <div style={{ background: '#FFF3CD', border: '1px solid #FFEAA7', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#856404', fontSize: '0.9rem' }}>{error}</div>}

        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box' }} />
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', background: loading ? '#999' : '#3B6D11', color: '#fff', padding: '0.75rem', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#999', fontSize: '0.85rem' }}>← Back to gaushala.network</Link>
        </div>
      </div>
    </div>
    </>
  );
}
