'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import { useParams } from 'next/navigation';

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  trust_level: string;
  status: string;
  category_name: string;
  updated_at: string;
  revisions: { id: number; edit_summary: string; created_at: string; trust_level: string }[];
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/wiki/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setArticle(d.article);
        else setError(d.error);
      })
      .catch(err => {
        logger.error('UI', 'wiki/[slug]/page.tsx', 'Fetch failed', { slug, err: String(err) });
        setError('Failed to load article');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ padding: '2rem', color: '#666' }}>Loading...</div>;
  if (error) return <div style={{ padding: '2rem', color: '#c00' }}>{error}</div>;
  if (!article) return null;

  return (
    <><SiteNav />
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/wiki" style={{ color: '#3B6D11', textDecoration: 'none', fontSize: '0.9rem' }}>← Knowledge Base</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <h1 style={{ color: '#3B6D11', fontSize: '2rem', fontWeight: 700, margin: 0 }}>{article.title}</h1>
        <Link href={`/wiki/${slug}/edit`}
          style={{ background: '#3B6D11', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
          Edit
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {article.category_name && (
          <span style={{ background: '#EAF3DE', color: '#3B6D11', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.8rem', fontWeight: 500 }}>{article.category_name}</span>
        )}
        <span style={{ background: article.trust_level === 'ai_generated' ? '#FFF3CD' : '#D4EDDA', color: article.trust_level === 'ai_generated' ? '#856404' : '#155724', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.8rem', fontWeight: 500 }}>
          {article.trust_level === 'ai_generated' ? '⚠ AI Generated — pending human verification' : '✓ Human Verified'}
        </span>
      </div>

      {article.summary && (
        <p style={{ color: '#555', fontSize: '1.05rem', borderLeft: '3px solid #3B6D11', paddingLeft: '1rem', marginBottom: '1.5rem' }}>{article.summary}</p>
      )}

      <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '1.5rem', background: '#fff', marginBottom: '1.5rem' }}>
        <div className="prose-content" dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: 10, padding: '1.25rem', background: '#FAFAFA' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, color: '#3B6D11', fontSize: '1rem' }}>Revision History ({article.revisions.length})</h3>
          <Link href={`/wiki/${slug}/history`} style={{ color: '#3B6D11', fontSize: '0.85rem' }}>View all →</Link>
        </div>
        {article.revisions.slice(0, 3).map(rev => (
          <div key={rev.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #eee', fontSize: '0.88rem' }}>
            <span style={{ color: '#444' }}>{rev.edit_summary}</span>
            <span style={{ color: '#999' }}>{new Date(rev.created_at).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
