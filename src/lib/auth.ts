import logger from '@/lib/logger';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'gn_jwt_secret_2026');

export interface SessionUser {
  id: number;
  email: string;
  display_name: string;
  trust_level_id: number;
  trust_level_name: string;
  trust_rank: number;
  can_edit: boolean;
  edits_require_review: boolean;
  can_approve: boolean;
  can_moderate: boolean;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('gn_session')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch (err) {
    logger.error('AUTH', 'auth.ts', 'Session verification failed', { err: String(err) });
    return null;
  }
}

export function getSessionFromRequest(req: Request): Promise<SessionUser | null> {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/gn_session=([^;]+)/);
    if (!match) return Promise.resolve(null);
    return jwtVerify(match[1], JWT_SECRET)
      .then(({ payload }) => payload as unknown as SessionUser)
      .catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}
