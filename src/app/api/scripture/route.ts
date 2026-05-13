import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const source_id = searchParams.get('source_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let sql = `SELECT sr.*, ss.name as source_name, ss.name_sanskrit as source_sanskrit, ss.category as source_category
               FROM scripture_refs sr
               JOIN scripture_sources ss ON sr.source_id = ss.id
               WHERE 1=1`;
    const params: unknown[] = [];

    if (source_id) {
      params.push(source_id);
      sql += ` AND sr.source_id = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (sr.meaning_english ILIKE $${params.length} OR sr.meaning_hindi ILIKE $${params.length} OR sr.context ILIKE $${params.length} OR sr.shloka ILIKE $${params.length})`;
    }

    sql += ` ORDER BY sr.source_id, sr.id LIMIT ${limit} OFFSET ${offset}`;

    const result = await query(sql, params);

    const countSql = `SELECT COUNT(*) FROM scripture_refs sr WHERE 1=1` +
      (source_id ? ` AND sr.source_id = $1` : '') +
      (search ? ` AND (sr.meaning_english ILIKE $${source_id ? 2 : 1} OR sr.meaning_hindi ILIKE $${source_id ? 2 : 1})` : '');

    const countParams = [...(source_id ? [source_id] : []), ...(search ? [`%${search}%`] : [])];
    const countResult = await query(countSql, countParams);

    logger.info('API', 'scripture/route.ts', 'Scripture refs fetched', { count: result.rows.length });
    return NextResponse.json({
      success: true,
      refs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    });
  } catch (err) {
    logger.error('API', 'scripture/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch scripture references' }, { status: 500 });
  }
}
