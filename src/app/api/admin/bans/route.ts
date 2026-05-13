import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'gn_admin_2026';

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const result = await query(
      `SELECT b.id, b.ban_type, b.reason, b.ip_address, b.created_at, b.expires_at, b.lifted_at, b.lift_note,
              u.email as user_email, u.display_name as user_name,
              a.email as banned_by_email
       FROM bans b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN users a ON b.banned_by = a.id
       ORDER BY b.created_at DESC`
    );

    logger.info('API', 'admin/bans/route.ts', 'Bans fetched', { count: result.rows.length });
    return NextResponse.json({ success: true, bans: result.rows });
  } catch (err) {
    logger.error('API', 'admin/bans/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch bans' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { action, ban_id, user_id, ip_address, ban_type, reason, expires_at, lift_note } = await req.json();

    if (action === 'ban') {
      if (!ban_type || !reason)
        return NextResponse.json({ success: false, error: 'ban_type and reason required' }, { status: 400 });

      const adminResult = await query(`SELECT id FROM users WHERE trust_level_id = (SELECT id FROM trust_levels WHERE name = 'admin') LIMIT 1`);
      const banned_by = adminResult.rows[0]?.id || 1;

      await query(
        `INSERT INTO bans (user_id, ip_address, ban_type, reason, banned_by, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user_id || null, ip_address || null, ban_type, reason, banned_by, expires_at || null]
      );

      if (user_id) {
        const bannedLevel = await query(`SELECT id FROM trust_levels WHERE name = 'banned'`);
        await query(`UPDATE users SET trust_level_id = $1 WHERE id = $2`, [bannedLevel.rows[0].id, user_id]);
      }

      logger.info('API', 'admin/bans/route.ts', 'Ban created', { user_id, ip_address, ban_type });
      return NextResponse.json({ success: true });

    } else if (action === 'lift') {
      if (!ban_id)
        return NextResponse.json({ success: false, error: 'ban_id required' }, { status: 400 });

      const banResult = await query(`SELECT user_id FROM bans WHERE id = $1`, [ban_id]);
      const banned_user_id = banResult.rows[0]?.user_id;

      await query(
        `UPDATE bans SET lifted_at = NOW(), lift_note = $1 WHERE id = $2`,
        [lift_note || null, ban_id]
      );

      if (banned_user_id) {
        const registeredLevel = await query(`SELECT id FROM trust_levels WHERE name = 'registered'`);
        await query(`UPDATE users SET trust_level_id = $1 WHERE id = $2`, [registeredLevel.rows[0].id, banned_user_id]);
      }

      logger.info('API', 'admin/bans/route.ts', 'Ban lifted', { ban_id });
      return NextResponse.json({ success: true });

    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (err) {
    logger.error('API', 'admin/bans/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to process ban action' }, { status: 500 });
  }
}
