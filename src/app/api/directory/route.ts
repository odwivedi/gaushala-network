import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import logger from '@/lib/logger';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'gaushala-postgres',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const state = searchParams.get('state') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    let where = 'WHERE is_active = true';
    const params: (string | number)[] = [];
    let idx = 1;

    if (search) {
      where += ` AND (name ILIKE $${idx} OR district ILIKE $${idx} OR address ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    if (state) {
      where += ` AND state = $${idx}`;
      params.push(state);
      idx++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM gaushalas ${where}`,
      params
    );

    const result = await pool.query(
      `SELECT id, name, state, district, address, phone, website, cow_count, description, latitude, longitude, is_verified, is_claimed, data_source
       FROM gaushalas ${where}
       ORDER BY is_verified DESC, name ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    const statesResult = await pool.query(
      `SELECT DISTINCT state FROM gaushalas WHERE is_active = true ORDER BY state`
    );

    logger.info('directory', 'api/directory/route.ts', 'Directory fetched', {
      search, state, page, count: result.rows.length
    });

    return NextResponse.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      states: statesResult.rows.map(r => r.state),
    });

  } catch (error) {
    logger.error('directory', 'api/directory/route.ts', 'Directory fetch failed', {
      error: String(error)
    });
    return NextResponse.json({ success: false, error: 'Failed to fetch directory' }, { status: 500 });
  }
}
