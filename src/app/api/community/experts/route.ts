import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(
      `SELECT ep.*, u.display_name, u.email
       FROM expert_profiles ep
       JOIN users u ON ep.user_id = u.id
       WHERE ep.verified = true
       ORDER BY ep.expertise, u.display_name`
    );
    logger.info('API', 'community/experts/route.ts', 'Experts fetched', { count: result.rows.length });
    return NextResponse.json({ success: true, experts: result.rows });
  } catch (err) {
    logger.error('API', 'community/experts/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch experts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sign in to apply as expert' }, { status: 401 });
    }

    const { expertise, bio, qualifications, organisation } = await req.json();
    if (!expertise) {
      return NextResponse.json({ success: false, error: 'Expertise is required' }, { status: 400 });
    }

    const existing = await query(`SELECT id FROM expert_profiles WHERE user_id = $1`, [user.id]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'You already have an expert profile' }, { status: 409 });
    }

    const result = await query(
      `INSERT INTO expert_profiles (user_id, expertise, bio, qualifications, organisation)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [user.id, expertise, bio, qualifications, organisation]
    );

    logger.info('API', 'community/experts/route.ts', 'Expert profile created', { user_id: user.id, expertise });
    return NextResponse.json({ success: true, profile: result.rows[0] }, { status: 201 });
  } catch (err) {
    logger.error('API', 'community/experts/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to create expert profile' }, { status: 500 });
  }
}
