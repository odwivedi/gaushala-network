import logger from '@/lib/logger';

const MEILI_URL = process.env.MEILI_URL || 'http://gaushala-meilisearch:7700';
const MEILI_KEY = process.env.MEILI_MASTER_KEY || '';

async function meili(method: string, path: string, body?: object) {
  const res = await fetch(`${MEILI_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MEILI_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export async function indexArticle(article: {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  trust_level: string;
  category_name: string | null;
  content?: string;
}) {
  try {
    await meili('POST', '/indexes/articles/documents', [{
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary || '',
      trust_level: article.trust_level,
      category: article.category_name || '',
      content: article.content ? article.content.replace(/<[^>]*>/g, '').slice(0, 1000) : '',
      type: 'article',
    }]);
    logger.info('SEARCH', 'search.ts', 'Article indexed', { id: article.id, title: article.title });
  } catch (err) {
    logger.error('SEARCH', 'search.ts', 'Article index failed', { err: String(err) });
  }
}

export async function indexGaushala(gaushala: {
  id: number;
  name: string;
  state: string | null;
  district: string | null;
  description: string | null;
  is_verified: boolean;
}) {
  try {
    await meili('POST', '/indexes/gaushalas/documents', [{
      id: gaushala.id,
      name: gaushala.name,
      state: gaushala.state || '',
      district: gaushala.district || '',
      description: gaushala.description || '',
      is_verified: gaushala.is_verified,
      type: 'gaushala',
    }]);
    logger.info('SEARCH', 'search.ts', 'Gaushala indexed', { id: gaushala.id, name: gaushala.name });
  } catch (err) {
    logger.error('SEARCH', 'search.ts', 'Gaushala index failed', { err: String(err) });
  }
}

export async function searchAll(query: string, limit = 10) {
  try {
    const results = await meili('POST', '/multi-search', {
      queries: [
        { indexUid: 'articles', q: query, limit, attributesToHighlight: ['title', 'summary'], highlightPreTag: '<mark>', highlightPostTag: '</mark>' },
        { indexUid: 'gaushalas', q: query, limit, attributesToHighlight: ['name', 'state'], highlightPreTag: '<mark>', highlightPostTag: '</mark>' },
      ]
    });
    return results.results || [];
  } catch (err) {
    logger.error('SEARCH', 'search.ts', 'Search failed', { err: String(err) });
    return [];
  }
}

export async function setupIndexes() {
  try {
    await meili('POST', '/indexes', { uid: 'articles', primaryKey: 'id' });
    await meili('PATCH', '/indexes/articles/settings', {
      searchableAttributes: ['title', 'summary', 'content', 'category'],
      displayedAttributes: ['id', 'title', 'slug', 'summary', 'trust_level', 'category', 'type'],
    });
    await meili('POST', '/indexes', { uid: 'gaushalas', primaryKey: 'id' });
    await meili('PATCH', '/indexes/gaushalas/settings', {
      searchableAttributes: ['name', 'state', 'district', 'description'],
      displayedAttributes: ['id', 'name', 'state', 'district', 'is_verified', 'type'],
    });
    logger.info('SEARCH', 'search.ts', 'Indexes set up');
  } catch (err) {
    logger.error('SEARCH', 'search.ts', 'Index setup failed', { err: String(err) });
  }
}
