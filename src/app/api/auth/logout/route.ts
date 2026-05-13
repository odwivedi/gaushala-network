import logger from '@/lib/logger';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set('gn_session', '', { maxAge: 0, path: '/' });
    logger.info('API', 'auth/logout/route.ts', 'User logged out');
    return response;
  } catch (err) {
    logger.error('API', 'auth/logout/route.ts', 'Logout failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}
