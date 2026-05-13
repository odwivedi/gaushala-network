import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getArticleContent } from '@/lib/db-mongo';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'gn_admin_2026';

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const status = new URL(req.url).searchParams.get('status') || 'pending';

    const result = await query(
      `SELECT mq.id, mq.status, mq.created_at, mq.review_note, mq.reviewed_at,
              a.title, a.slug,
              ar.id as revision_id, ar.mongo_content_id, ar.edit_summary, ar.trust_level,
              u.email as submitted_by_email, u.display_name as submitted_by_name
       FROM moderation_queue mq
       JOIN articles a ON mq.article_id = a.id
       JOIN article_revisions ar ON mq.revision_id = ar.id
       LEFT JOIN users u ON mq.submitted_by = u.id
       WHERE mq.status = $1
       ORDER BY mq.created_at ASC`,
      [status]
    );

    const items = await Promise.all(
      result.rows.map(async (row) => ({
        ...row,
        content: await getArticleContent(row.mongo_content_id),
      }))
    );

    logger.info('API', 'admin/moderation/route.ts', 'Moderation queue fetched', { status, count: items.length });
    return NextResponse.json({ success: true, items });
  } catch (err) {
    logger.error('API', 'admin/moderation/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch moderation queue' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action, review_note } = await req.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    const mq = await query(
      `SELECT mq.*, a.slug, ar.mongo_content_id
       FROM moderation_queue mq
       JOIN articles a ON mq.article_id = a.id
       JOIN article_revisions ar ON mq.revision_id = ar.id
       WHERE mq.id = $1`,
      [id]
    );

    if (mq.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Queue item not found' }, { status: 404 });
    }

    const item = mq.rows[0];

    await query(
      `UPDATE moderation_queue SET status = $1, review_note = $2, reviewed_at = NOW() WHERE id = $3`,
      [action === 'approve' ? 'approved' : 'rejected', review_note || null, id]
    );

    if (action === 'approve') {
      await query(
        `UPDATE articles SET mongo_content_id = $1, updated_at = NOW() WHERE id = $2`,
        [item.mongo_content_id, item.article_id]
      );
      logger.info('API', 'admin/moderation/route.ts', 'Edit approved', { queue_id: id, slug: item.slug });
    } else {
      logger.info('API', 'admin/moderation/route.ts', 'Edit rejected', { queue_id: id, slug: item.slug });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('API', 'admin/moderation/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to process moderation action' }, { status: 500 });
  }
}
