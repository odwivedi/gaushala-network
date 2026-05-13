'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import WikiEditor from '@/components/WikiEditor';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/wiki/categories')
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.categories); });
  }, []);

  useEffect(() => {
    setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  }, [title]);

  async function handleCreate() {
    if (!title.trim() || !slug.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, summary, content, category_id: categoryId }),
      });
      const data = await res.json();
      if (data.success) {
        logger.info('UI', 'wiki/new/page.tsx', 'Article created', { slug });
        router.push(`/wiki/${data.article.slug}`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      logger.error('UI', 'wiki/new/page.tsx', 'Create failed', { err: String(err) });
      setError('Failed to create article');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href="/wiki" style={{ color: '#3B6D11', textDecoration: 'none', fontSize: '0.9rem' }}>← Knowledge Base</Link>
      </div>

      <h1 style={{ color: '#3B6D11', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>New Article</h1>

      {error && <div style={{ background: '#FFF3CD', border: '1px solid #FFEAA7', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#856404' }}>{error}</div>}

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Gir Cow Breed"
            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box', background: '#f9f9f9' }} />
          <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>URL: /wiki/{slug}</p>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Category</label>
          <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box' }}>
            <option value="">— Select category —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Summary</label>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2}
            placeholder="One or two sentences describing the article"
            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Content</label>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
          <WikiEditor initialContent={content} onChange={setContent} editable={true} />
        </div>
      </div>

      <button onClick={handleCreate} disabled={saving}
        style={{ background: saving ? '#999' : '#3B6D11', color: '#fff', padding: '0.7rem 2rem', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
        {saving ? 'Creating...' : 'Create Article'}
      </button>
    </div>
  );
}
