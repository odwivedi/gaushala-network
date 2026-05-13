import logger from '@/lib/logger';
import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gn_jwt_secret_2026');

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('gn_session')?.value;
    if (!token) {
      return NextResponse.json({ success: false, user: null });
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return NextResponse.json({ success: true, user: payload });
  } catch (err) {
    logger.error('API', 'auth/me/route.ts', 'Session check failed', { err: String(err) });
    return NextResponse.json({ success: false, user: null });
  }
}
