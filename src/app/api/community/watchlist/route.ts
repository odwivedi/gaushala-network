import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sign in to view watchlist' }, { status: 401 });
    }

    const result = await query(
      `SELECT * FROM watchlists WHERE user_id = $1 ORDER BY created_at DESC`,
      [user.id]
    );
    logger.info('API', 'community/watchlist/route.ts', 'Watchlist fetched', { user_id: user.id, count: result.rows.length });
    return NextResponse.json({ success: true, watchlist: result.rows });
  } catch (err) {
    logger.error('API', 'community/watchlist/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sign in to watch pages' }, { status: 401 });
    }

    const { entity_type, entity_id, action } = await req.json();

    if (!entity_type || !entity_id) {
      return NextResponse.json({ success: false, error: 'entity_type and entity_id required' }, { status: 400 });
    }

    if (action === 'unwatch') {
      await query(
        `DELETE FROM watchlists WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3`,
        [user.id, entity_type, entity_id]
      );
      logger.info('API', 'community/watchlist/route.ts', 'Unwatched', { user_id: user.id, entity_type, entity_id });
      return NextResponse.json({ success: true, watching: false });
    }

    await query(
      `INSERT INTO watchlists (user_id, entity_type, entity_id) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING`,
      [user.id, entity_type, entity_id]
    );
    logger.info('API', 'community/watchlist/route.ts', 'Watched', { user_id: user.id, entity_type, entity_id });
    return NextResponse.json({ success: true, watching: true });
  } catch (err) {
    logger.error('API', 'community/watchlist/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to update watchlist' }, { status: 500 });
  }
}
