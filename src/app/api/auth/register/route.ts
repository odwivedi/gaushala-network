import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password, display_name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (email, password_hash, display_name, trust_level_id)
       VALUES ($1, $2, $3, 2) RETURNING id, email, display_name, trust_level_id, created_at`,
      [email.toLowerCase().trim(), password_hash, display_name || email.split('@')[0]]
    );

    logger.info('API', 'auth/register/route.ts', 'User registered', { email });
    return NextResponse.json({ success: true, user: result.rows[0] }, { status: 201 });
  } catch (err) {
    logger.error('API', 'auth/register/route.ts', 'Registration failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Registration failed' }, { status: 500 });
  }
}
