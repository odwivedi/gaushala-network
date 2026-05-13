import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user_id = new URL(req.url).searchParams.get('user_id');

    if (user_id) {
      const result = await query(
        `SELECT u.id, u.display_name, u.created_at,
                tl.name as trust_level_name, tl.rank as trust_rank,
                up.bio, up.expertise, up.organisation, up.website,
                up.location, up.avatar_url, up.contribution_count
         FROM users u
         JOIN trust_levels tl ON u.trust_level_id = tl.id
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE u.id = $1 AND u.is_active = true`,
        [user_id]
      );
      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, profile: result.rows[0] });
    }

    const result = await query(
      `SELECT u.id, u.display_name, u.created_at,
              tl.name as trust_level_name, tl.rank as trust_rank,
              up.bio, up.expertise, up.organisation, up.avatar_url,
              up.location, up.contribution_count
       FROM users u
       JOIN trust_levels tl ON u.trust_level_id = tl.id
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.is_active = true
       ORDER BY u.created_at DESC`
    );
    logger.info('API', 'community/profile/route.ts', 'Members fetched', { count: result.rows.length });
    return NextResponse.json({ success: true, members: result.rows });
  } catch (err) {
    logger.error('API', 'community/profile/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sign in to update your profile' }, { status: 401 });
    }

    const { bio, expertise, organisation, website, location, avatar_url } = await req.json();

    const existing = await query(`SELECT id FROM user_profiles WHERE user_id = $1`, [user.id]);

    if (existing.rows.length > 0) {
      await query(
        `UPDATE user_profiles SET bio=$1, expertise=$2, organisation=$3, website=$4, location=$5, avatar_url=$6, updated_at=NOW()
         WHERE user_id=$7`,
        [bio, expertise, organisation, website, location, avatar_url, user.id]
      );
    } else {
      await query(
        `INSERT INTO user_profiles (user_id, bio, expertise, organisation, website, location, avatar_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [user.id, bio, expertise, organisation, website, location, avatar_url]
      );
    }

    logger.info('API', 'community/profile/route.ts', 'Profile updated', { user_id: user.id });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('API', 'community/profile/route.ts', 'PUT failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
