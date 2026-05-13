import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const grahas = await query(
      `SELECT g.*, COUNT(r.id) as remedy_count
       FROM jyotish_grahas g
       LEFT JOIN jyotish_remedies r ON r.graha_id = g.id
       GROUP BY g.id ORDER BY g.id`
    );
    logger.info('API', 'jyotish/route.ts', 'Grahas fetched', { count: grahas.rows.length });
    return NextResponse.json({ success: true, grahas: grahas.rows });
  } catch (err) {
    logger.error('API', 'jyotish/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch grahas' }, { status: 500 });
  }
}
