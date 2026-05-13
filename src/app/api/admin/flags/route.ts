import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'gn_admin_2026';

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const status = new URL(req.url).searchParams.get('status') || 'open';

    const result = await query(
      `SELECT f.id, f.reason, f.note, f.status, f.created_at, f.resolved_at,
              a.title, a.slug,
              u.email as flagged_by_email,
              r.email as resolved_by_email
       FROM article_flags f
       JOIN articles a ON f.article_id = a.id
       LEFT JOIN users u ON f.flagged_by = u.id
       LEFT JOIN users r ON f.resolved_by = r.id
       WHERE f.status = $1
       ORDER BY f.created_at ASC`,
      [status]
    );

    logger.info('API', 'admin/flags/route.ts', 'Flags fetched', { status, count: result.rows.length });
    return NextResponse.json({ success: true, flags: result.rows });
  } catch (err) {
    logger.error('API', 'admin/flags/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch flags' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id, action } = await req.json();

    if (!['resolve', 'dismiss'].includes(action))
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

    await query(
      `UPDATE article_flags SET status = $1, resolved_at = NOW() WHERE id = $2`,
      [action === 'resolve' ? 'resolved' : 'dismissed', id]
    );

    logger.info('API', 'admin/flags/route.ts', 'Flag updated', { id, action });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('API', 'admin/flags/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to update flag' }, { status: 500 });
  }
}
