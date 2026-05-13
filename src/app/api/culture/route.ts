import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const type = new URL(req.url).searchParams.get('type') || 'festivals';

    if (type === 'festivals') {
      const result = await query(`SELECT * FROM festivals ORDER BY id`);
      logger.info('API', 'culture/route.ts', 'Festivals fetched', { count: result.rows.length });
      return NextResponse.json({ success: true, data: result.rows });
    }

    if (type === 'traditions') {
      const result = await query(`SELECT * FROM regional_traditions ORDER BY state, id`);
      logger.info('API', 'culture/route.ts', 'Traditions fetched', { count: result.rows.length });
      return NextResponse.json({ success: true, data: result.rows });
    }

    return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
  } catch (err) {
    logger.error('API', 'culture/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch cultural data' }, { status: 500 });
  }
}
