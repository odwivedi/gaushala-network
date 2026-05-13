import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const graha_id = new URL(req.url).searchParams.get('graha_id');
    let result;
    if (graha_id) {
      result = await query(
        `SELECT r.*, g.name as graha_name, g.name_sanskrit as graha_sanskrit
         FROM jyotish_remedies r
         JOIN jyotish_grahas g ON r.graha_id = g.id
         WHERE r.graha_id = $1 ORDER BY r.id`,
        [graha_id]
      );
    } else {
      result = await query(
        `SELECT g.*, COUNT(r.id) as remedy_count
         FROM jyotish_grahas g
         LEFT JOIN jyotish_remedies r ON r.graha_id = g.id
         GROUP BY g.id ORDER BY g.id`
      );
    }
    logger.info('API', 'jyotish/grahas/route.ts', 'Fetched', { graha_id, count: result.rows.length });
    return NextResponse.json({ success: true, data: result.rows });
  } catch (err) {
    logger.error('API', 'jyotish/grahas/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch' }, { status: 500 });
  }
}
