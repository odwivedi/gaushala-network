'use client';
import logger from '@/lib/logger';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import WikiEditor from '@/components/WikiEditor';

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function EditArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [editSummary, setEditSummary] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/wiki/categories')
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.categories); });

    fetch(`/api/wiki/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setTitle(d.article.title);
          setSummary(d.article.summary || '');
          setContent(d.article.content || '');
          setCategoryId(d.article.category_id);
        } else {
          setError(d.error);
        }
      })
      .catch(err => {
        logger.error('UI', 'wiki/[slug]/edit/page.tsx', 'Fetch failed', { slug, err: String(err) });
        setError('Failed to load article');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSave() {
    if (!editSummary.trim()) {
      setError('Please enter an edit summary');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/wiki/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary, content, category_id: categoryId, edit_summary: editSummary }),
      });
      const data = await res.json();
      if (data.success) {
        logger.info('UI', 'wiki/[slug]/edit/page.tsx', 'Article saved', { slug });
        router.push(`/wiki/${slug}`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      logger.error('UI', 'wiki/[slug]/edit/page.tsx', 'Save failed', { slug, err: String(err) });
      setError('Failed to save article');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: '2rem', color: '#666' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link href={`/wiki/${slug}`} style={{ color: '#3B6D11', textDecoration: 'none', fontSize: '0.9rem' }}>← Cancel</Link>
      </div>

      <h1 style={{ color: '#3B6D11', fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Edit Article</h1>

      {error && <div style={{ background: '#FFF3CD', border: '1px solid #FFEAA7', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#856404' }}>{error}</div>}

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box' }} />
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
            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Content</label>
        <div style={{ border: '1px solid #ccc', borderRadius: 8, overflow: 'hidden' }}>
          <WikiEditor initialContent={content} onChange={setContent} editable={true} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.3rem', color: '#333' }}>Edit summary</label>
          <input value={editSummary} onChange={e => setEditSummary(e.target.value)}
            placeholder="Briefly describe what you changed"
            style={{ width: '100%', padding: '0.65rem 0.9rem', border: '1px solid #ccc', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box' }} />
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ background: saving ? '#999' : '#3B6D11', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
