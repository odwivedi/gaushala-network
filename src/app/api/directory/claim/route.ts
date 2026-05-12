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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gaushala_id, contact_name, contact_phone, contact_email, note } = body;

    if (!gaushala_id || !contact_name || !contact_phone || !contact_email) {
      return NextResponse.json({ success: false, error: 'Name, phone and email are required' }, { status: 400 });
    }

    // Check if already claimed
    const existing = await pool.query(
      `SELECT id FROM gaushala_claims WHERE gaushala_id = $1 AND status = 'pending'`,
      [gaushala_id]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'A claim is already pending for this gaushala' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO gaushala_claims (gaushala_id, contact_name, contact_phone, contact_email, note, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [gaushala_id, contact_name, contact_phone, contact_email, note || null]
    );

    logger.info('directory', 'api/directory/claim/route.ts', 'Claim submitted', { gaushala_id, contact_email });
    return NextResponse.json({ success: true, message: 'Claim submitted successfully. We will review and contact you within 48 hours.' });

  } catch (error) {
    logger.error('directory', 'api/directory/claim/route.ts', 'Claim failed', { error: String(error) });
    return NextResponse.json({ success: false, error: 'Failed to submit claim' }, { status: 500 });
  }
}
