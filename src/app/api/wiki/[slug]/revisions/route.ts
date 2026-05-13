import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getArticleContent } from '@/lib/db-mongo';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const article = await query(
      `SELECT id FROM articles WHERE slug = $1 AND status != 'deleted'`,
      [params.slug]
    );

    if (article.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const revisions = await query(
      `SELECT ar.id, ar.mongo_content_id, ar.edit_summary, ar.trust_level, ar.edited_by, ar.created_at, u.display_name as editor_name
       FROM article_revisions ar
       LEFT JOIN users u ON ar.edited_by = u.id
       WHERE ar.article_id = $1 ORDER BY ar.created_at DESC`,
      [article.rows[0].id]
    );

    const revisionsWithContent = await Promise.all(
      revisions.rows.map(async (rev) => ({
        ...rev,
        content: await getArticleContent(rev.mongo_content_id),
      }))
    );

    logger.info('API', 'wiki/[slug]/revisions/route.ts', 'Revisions fetched', { slug: params.slug, count: revisions.rows.length });
    return NextResponse.json({ success: true, revisions: revisionsWithContent });
  } catch (err) {
    logger.error('API', 'wiki/[slug]/revisions/route.ts', 'GET failed', { slug: params.slug, err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch revisions' }, { status: 500 });
  }
}
