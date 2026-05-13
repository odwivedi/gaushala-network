import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gn_jwt_secret_2026');

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const result = await query(
      `SELECT u.*, tl.name as trust_level_name, tl.rank as trust_rank,
              tl.can_edit, tl.edits_require_review, tl.can_approve, tl.can_moderate
       FROM users u
       JOIN trust_levels tl ON u.trust_level_id = tl.id
       WHERE u.email = $1 AND u.is_active = true`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    const user = result.rows[0];

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return NextResponse.json({ success: false, error: 'Account temporarily locked. Try again later.' }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await query(
        `UPDATE users SET login_attempts = login_attempts + 1,
         locked_until = CASE WHEN login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes' ELSE locked_until END
         WHERE id = $1`,
        [user.id]
      );
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    await query(
      `UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1`,
      [user.id]
    );

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      trust_level_id: user.trust_level_id,
      trust_level_name: user.trust_level_name,
      trust_rank: user.trust_rank,
      can_edit: user.can_edit,
      edits_require_review: user.edits_require_review,
      can_approve: user.can_approve,
      can_moderate: user.can_moderate,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        trust_level_name: user.trust_level_name,
        trust_rank: user.trust_rank,
        can_edit: user.can_edit,
        edits_require_review: user.edits_require_review,
        can_approve: user.can_approve,
        can_moderate: user.can_moderate,
      }
    });

    response.cookies.set('gn_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    logger.info('API', 'auth/login/route.ts', 'User logged in', { email, trust_level: user.trust_level_name });
    return response;
  } catch (err) {
    logger.error('API', 'auth/login/route.ts', 'Login failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
