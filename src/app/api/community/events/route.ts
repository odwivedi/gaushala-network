import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get('state');
    const upcoming = searchParams.get('upcoming') !== 'false';

    let sql = `SELECT * FROM events WHERE 1=1`;
    const params: unknown[] = [];

    if (upcoming) {
      sql += ` AND start_date >= CURRENT_DATE`;
    }
    if (state) {
      params.push(state);
      sql += ` AND state = $${params.length}`;
    }

    sql += ` ORDER BY start_date ASC LIMIT 50`;

    const result = await query(sql, params);
    logger.info('API', 'community/events/route.ts', 'Events fetched', { count: result.rows.length });
    return NextResponse.json({ success: true, events: result.rows });
  } catch (err) {
    logger.error('API', 'community/events/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sign in to submit events' }, { status: 401 });
    }

    const { title, description, event_type, state, city, venue, start_date, end_date, organiser, contact, registration_url } = await req.json();

    if (!title || !start_date) {
      return NextResponse.json({ success: false, error: 'Title and start date are required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO events (title, description, event_type, state, city, venue, start_date, end_date, organiser, contact, registration_url, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [title, description, event_type, state, city, venue, start_date, end_date || null, organiser, contact, registration_url, user.id]
    );

    logger.info('API', 'community/events/route.ts', 'Event created', { title, user_id: user.id });
    return NextResponse.json({ success: true, event: result.rows[0] }, { status: 201 });
  } catch (err) {
    logger.error('API', 'community/events/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 500 });
  }
}
