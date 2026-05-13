import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getArticleContent, saveArticleContent } from '@/lib/db-mongo';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const result = await query(
      `SELECT a.*, c.name as category_name, c.slug as category_slug
       FROM articles a
       LEFT JOIN article_categories c ON a.category_id = c.id
       WHERE a.slug = $1 AND a.status != 'deleted'`,
      [params.slug]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const article = result.rows[0];
    article.content = await getArticleContent(article.mongo_content_id);

    const revisions = await query(
      `SELECT ar.id, ar.edit_summary, ar.trust_level, ar.edited_by, ar.created_at, u.display_name as editor_name
       FROM article_revisions ar
       LEFT JOIN users u ON ar.edited_by = u.id
       WHERE ar.article_id = $1 ORDER BY ar.created_at DESC`,
      [article.id]
    );
    article.revisions = revisions.rows;

    logger.info('API', 'wiki/[slug]/route.ts', 'Article fetched', { slug: params.slug });
    return NextResponse.json({ success: true, article });
  } catch (err) {
    logger.error('API', 'wiki/[slug]/route.ts', 'GET failed', { slug: params.slug, err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch article' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = await getSessionFromRequest(req);
    const body = await req.json();
    const { title, summary, content, edit_summary, category_id } = body;

    const existing = await query(
      `SELECT * FROM articles WHERE slug = $1 AND status != 'deleted'`,
      [params.slug]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const article = existing.rows[0];
    const mongoId = await saveArticleContent(content, article.mongo_content_id);

    const trustLevel = user ? (user.edits_require_review ? 'registered' : 'contributor') : 'anonymous';
    const requiresReview = !user || user.edits_require_review;

    await query(
      `UPDATE articles SET title = $1, summary = $2, category_id = $3, updated_at = NOW()
       WHERE slug = $4`,
      [title || article.title, summary || article.summary, category_id || article.category_id, params.slug]
    );

    const revResult = await query(
      `INSERT INTO article_revisions (article_id, mongo_content_id, edit_summary, trust_level, edited_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [article.id, mongoId, edit_summary || 'Updated', trustLevel, user?.id || null]
    );

    if (requiresReview) {
      await query(
        `INSERT INTO moderation_queue (article_id, revision_id, submitted_by, status)
         VALUES ($1, $2, $3, 'pending')`,
        [article.id, revResult.rows[0].id, user?.id || null]
      );
      logger.info('API', 'wiki/[slug]/route.ts', 'Edit sent to moderation queue', { slug: params.slug, user_id: user?.id });
      return NextResponse.json({ success: true, queued: true, message: 'Your edit has been submitted for review.' });
    }

    logger.info('API', 'wiki/[slug]/route.ts', 'Article updated directly', { slug: params.slug, user_id: user?.id });
    return NextResponse.json({ success: true, queued: false });
  } catch (err) {
    logger.error('API', 'wiki/[slug]/route.ts', 'PUT failed', { slug: params.slug, err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to update article' }, { status: 500 });
  }
}
