import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getArticleContent, saveArticleContent } from '@/lib/db-mongo';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sign in to revert' }, { status: 401 });
    }

    const { revision_id } = await req.json();
    if (!revision_id) {
      return NextResponse.json({ success: false, error: 'revision_id required' }, { status: 400 });
    }

    const article = await query(
      `SELECT * FROM articles WHERE slug = $1 AND status != 'deleted'`,
      [params.slug]
    );
    if (article.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
    }

    const revision = await query(
      `SELECT * FROM article_revisions WHERE id = $1 AND article_id = $2`,
      [revision_id, article.rows[0].id]
    );
    if (revision.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Revision not found' }, { status: 404 });
    }

    const content = await getArticleContent(revision.rows[0].mongo_content_id);
    const mongoId = await saveArticleContent(content);

    const trustLevel = user.edits_require_review ? 'registered' : 'contributor';
    const requiresReview = user.edits_require_review;

    await query(
      `UPDATE articles SET updated_at = NOW() WHERE slug = $1`,
      [params.slug]
    );

    const revResult = await query(
      `INSERT INTO article_revisions (article_id, mongo_content_id, edit_summary, trust_level, edited_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [article.rows[0].id, mongoId, `Reverted to version from ${new Date(revision.rows[0].created_at).toLocaleDateString()}`, trustLevel, user.id]
    );

    if (requiresReview) {
      await query(
        `INSERT INTO moderation_queue (article_id, revision_id, submitted_by, status)
         VALUES ($1, $2, $3, 'pending')`,
        [article.rows[0].id, revResult.rows[0].id, user.id]
      );
      logger.info('API', 'wiki/[slug]/revert/route.ts', 'Revert queued for moderation', { slug: params.slug, revision_id, user_id: user.id });
      return NextResponse.json({ success: true, queued: true, message: 'Revert submitted for review.' });
    }

    await query(
      `UPDATE articles SET mongo_content_id = $1, updated_at = NOW() WHERE slug = $2`,
      [mongoId, params.slug]
    );

    logger.info('API', 'wiki/[slug]/revert/route.ts', 'Article reverted', { slug: params.slug, revision_id, user_id: user.id });
    return NextResponse.json({ success: true, queued: false });
  } catch (err) {
    logger.error('API', 'wiki/[slug]/revert/route.ts', 'POST failed', { slug: params.slug, err: String(err) });
    return NextResponse.json({ success: false, error: 'Revert failed' }, { status: 500 });
  }
}
