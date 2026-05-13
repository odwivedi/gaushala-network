import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(
      `SELECT c.id, c.name, c.slug, c.description,
              COUNT(a.id) as article_count
       FROM article_categories c
       LEFT JOIN articles a ON a.category_id = c.id AND a.status != 'deleted'
       GROUP BY c.id ORDER BY c.name`
    );
    logger.info('API', 'wiki/categories/route.ts', 'Categories fetched', { count: result.rows.length });
    return NextResponse.json({ success: true, categories: result.rows });
  } catch (err) {
    logger.error('API', 'wiki/categories/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 });
  }
}
