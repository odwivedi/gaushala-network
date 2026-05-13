import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM panchagavya_entries ORDER BY id`
    );
    logger.info('API', 'scripture/panchagavya/route.ts', 'Panchagavya entries fetched', { count: result.rows.length });
    return NextResponse.json({ success: true, entries: result.rows });
  } catch (err) {
    logger.error('API', 'scripture/panchagavya/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch panchagavya entries' }, { status: 500 });
  }
}
