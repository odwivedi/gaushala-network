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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await pool.query(
      `SELECT g.*, gt.name as type_name
       FROM gaushalas g
       LEFT JOIN gaushala_types gt ON g.type_id = gt.id
       WHERE g.id = $1 AND g.is_active = true`,
      [params.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    logger.info('directory', 'api/directory/[id]/route.ts', 'Gaushala fetched', { id: params.id });
    return NextResponse.json({ success: true, data: result.rows[0] });

  } catch (error) {
    logger.error('directory', 'api/directory/[id]/route.ts', 'Fetch failed', { error: String(error), id: params.id });
    return NextResponse.json({ success: false, error: 'Failed to fetch gaushala' }, { status: 500 });
  }
}
