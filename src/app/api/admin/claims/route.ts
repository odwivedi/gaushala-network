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

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'gn_admin_2026';

function isAuthorized(req: NextRequest) {
  const secret = req.headers.get('x-admin-secret');
  return secret === ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await pool.query(`
      SELECT c.*, g.name as gaushala_name, g.state, g.district, g.is_claimed
      FROM gaushala_claims c
      JOIN gaushalas g ON c.gaushala_id = g.id
      ORDER BY c.created_at DESC
    `);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    logger.error('admin', 'api/admin/claims/route.ts', 'Fetch claims failed', { error: String(error) });
    return NextResponse.json({ success: false, error: 'Failed to fetch claims' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { claim_id, action, gaushala_id } = await req.json();
    if (action === 'approve') {
      await pool.query(`UPDATE gaushala_claims SET status = 'approved', reviewed_at = NOW() WHERE id = $1`, [claim_id]);
      await pool.query(`UPDATE gaushalas SET is_claimed = true, is_verified = true WHERE id = $1`, [gaushala_id]);
      logger.info('admin', 'api/admin/claims/route.ts', 'Claim approved', { claim_id, gaushala_id });
    } else if (action === 'reject') {
      await pool.query(`UPDATE gaushala_claims SET status = 'rejected', reviewed_at = NOW() WHERE id = $1`, [claim_id]);
      logger.info('admin', 'api/admin/claims/route.ts', 'Claim rejected', { claim_id });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('admin', 'api/admin/claims/route.ts', 'Action failed', { error: String(error) });
    return NextResponse.json({ success: false, error: 'Action failed' }, { status: 500 });
  }
}
