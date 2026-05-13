import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'gn_admin_2026';

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const result = await query(
      `SELECT u.id, u.email, u.display_name, u.created_at, u.last_login,
              tl.name as trust_level, tl.id as trust_level_id,
              COUNT(DISTINCT ar.id) as revision_count,
              COUNT(DISTINCT b.id) as active_ban_count
       FROM users u
       LEFT JOIN trust_levels tl ON u.trust_level_id = tl.id
       LEFT JOIN article_revisions ar ON ar.edited_by = u.id
       LEFT JOIN bans b ON b.user_id = u.id AND b.lifted_at IS NULL
       GROUP BY u.id, tl.name, tl.id
       ORDER BY u.created_at DESC`
    );

    logger.info('API', 'admin/users/route.ts', 'Users fetched', { count: result.rows.length });
    return NextResponse.json({ success: true, users: result.rows });
  } catch (err) {
    logger.error('API', 'admin/users/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { user_id, trust_level } = await req.json();

    if (!user_id || !trust_level)
      return NextResponse.json({ success: false, error: 'user_id and trust_level required' }, { status: 400 });

    const levelResult = await query(`SELECT id FROM trust_levels WHERE name = $1`, [trust_level]);
    if (levelResult.rows.length === 0)
      return NextResponse.json({ success: false, error: 'Invalid trust_level' }, { status: 400 });

    const new_level_id = levelResult.rows[0].id;

    const prev = await query(`SELECT trust_level_id FROM users WHERE id = $1`, [user_id]);
    if (prev.rows.length === 0)
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const from_level_id = prev.rows[0].trust_level_id;

    await query(`UPDATE users SET trust_level_id = $1 WHERE id = $2`, [new_level_id, user_id]);

    await query(
      `INSERT INTO trust_level_changes (user_id, from_level, to_level, changed_by, reason)
       VALUES ($1, $2, $3, NULL, 'Admin manual change')`,
      [user_id, from_level_id, new_level_id]
    );

    logger.info('API', 'admin/users/route.ts', 'Trust level updated', { user_id, from_level_id, new_level_id });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('API', 'admin/users/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to update trust level' }, { status: 500 });
  }
}
