import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await query(
      `SELECT ss.*, COUNT(sr.id) as ref_count
       FROM scripture_sources ss
       LEFT JOIN scripture_refs sr ON sr.source_id = ss.id
       GROUP BY ss.id ORDER BY ss.category, ss.name`
    );
    logger.info('API', 'scripture/sources/route.ts', 'Sources fetched', { count: result.rows.length });
    return NextResponse.json({ success: true, sources: result.rows });
  } catch (err) {
    logger.error('API', 'scripture/sources/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch sources' }, { status: 500 });
  }
}
