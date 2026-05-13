'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  trust_level: string;
  category_name: string;
  category_slug: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  article_count: number;
}

export default function WikiPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/wiki/categories')
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.categories); })
      .catch(err => logger.error('UI', 'wiki/page.tsx', 'Failed to fetch categories', { err: String(err) }));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (activeCategory) params.set('category', activeCategory);
    fetch(`/api/wiki?${params}`)
      .then(r => r.json())
      .then(d => { if (d.success) setArticles(d.articles); })
      .catch(err => logger.error('UI', 'wiki/page.tsx', 'Failed to fetch articles', { err: String(err) }))
      .finally(() => setLoading(false));
  }, [search, activeCategory]);

  return (
    <><SiteNav />
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ color: '#3B6D11', fontSize: '2rem', fontWeight: 700, margin: 0 }}>Knowledge Base</h1>
          <p style={{ color: '#666', marginTop: '0.25rem' }}>Wiki articles on every aspect of the cow</p>
        </div>
        <Link href="/wiki/new" style={{ background: '#3B6D11', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>
          + New Article
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search articles..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', marginBottom: '1.5rem', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <button onClick={() => setActiveCategory('')}
          style={{ padding: '0.4rem 1rem', borderRadius: 20, border: '1px solid #3B6D11', background: activeCategory === '' ? '#3B6D11' : '#fff', color: activeCategory === '' ? '#fff' : '#3B6D11', cursor: 'pointer', fontWeight: 500 }}>
          All
        </button>
        {categories.map(c => (
          <button key={c.slug} onClick={() => setActiveCategory(c.slug)}
            style={{ padding: '0.4rem 1rem', borderRadius: 20, border: '1px solid #3B6D11', background: activeCategory === c.slug ? '#3B6D11' : '#fff', color: activeCategory === c.slug ? '#fff' : '#3B6D11', cursor: 'pointer', fontWeight: 500 }}>
            {c.name} ({c.article_count})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#666' }}>Loading...</p>
      ) : articles.length === 0 ? (
        <p style={{ color: '#666' }}>No articles found.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {articles.map(a => (
            <Link key={a.id} href={`/wiki/${a.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: '#fff', transition: 'box-shadow 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(59,109,17,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 style={{ color: '#3B6D11', fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>{a.title}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {a.category_name && (
                      <span style={{ background: '#EAF3DE', color: '#3B6D11', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.78rem', fontWeight: 500 }}>{a.category_name}</span>
                    )}
                    <span style={{ background: a.trust_level === 'ai_generated' ? '#FFF3CD' : '#D4EDDA', color: a.trust_level === 'ai_generated' ? '#856404' : '#155724', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.78rem', fontWeight: 500 }}>
                      {a.trust_level === 'ai_generated' ? 'AI Generated' : 'Verified'}
                    </span>
                  </div>
                </div>
                {a.summary && <p style={{ color: '#555', marginTop: '0.5rem', marginBottom: 0, fontSize: '0.95rem' }}>{a.summary}</p>}
                <p style={{ color: '#999', fontSize: '0.8rem', marginTop: '0.5rem', marginBottom: 0 }}>Updated {new Date(a.updated_at).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
