import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const { reason, note } = await req.json();

    if (!reason)
      return NextResponse.json({ success: false, error: 'Reason required' }, { status: 400 });

    const articleResult = await query(`SELECT id FROM articles WHERE slug = $1`, [slug]);
    if (articleResult.rows.length === 0)
      return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });

    const article_id = articleResult.rows[0].id;

    const session = await getSessionFromRequest(req);
    const flagged_by = session?.id || null;

    await query(
      `INSERT INTO article_flags (article_id, flagged_by, reason, note, status)
       VALUES ($1, $2, $3, $4, 'open')`,
      [article_id, flagged_by, reason, note || null]
    );

    logger.info('API', 'wiki/[slug]/flag/route.ts', 'Article flagged', { slug, reason, flagged_by });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('API', 'wiki/[slug]/flag/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to submit flag' }, { status: 500 });
  }
}
