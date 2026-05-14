import logger from '@/lib/logger';
import crypto from 'crypto';
import { query } from '@/lib/db-postgres';
import { writeHashToChain, getWalletBalance } from '@/lib/blockchain';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'gn_admin_2026';

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const records = await query(
      `SELECT * FROM blockchain_records ORDER BY created_at DESC LIMIT 50`
    );

    let balance = 'unknown';
    try {
      balance = await getWalletBalance();
    } catch {
      balance = 'unavailable';
    }

    logger.info('API', 'api/blockchain/route.ts', 'Blockchain records fetched', { count: records.rows.length });
    return NextResponse.json({ success: true, records: records.rows, wallet_balance: balance });
  } catch (err) {
    logger.error('API', 'api/blockchain/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch blockchain records' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET)
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { record_type, entity_type, entity_id } = await req.json();

    if (!record_type)
      return NextResponse.json({ success: false, error: 'record_type required' }, { status: 400 });

    let data: object = { record_type, entity_type, entity_id, timestamp: new Date().toISOString() };

    if (entity_type === 'article' && entity_id) {
      const article = await query(`SELECT id, title, slug, trust_level, updated_at FROM articles WHERE id = $1`, [entity_id]);
      if (article.rows.length > 0) data = { ...data, article: article.rows[0] };
    }

    if (entity_type === 'gaushala' && entity_id) {
      const gaushala = await query(`SELECT id, name, state, district, is_verified FROM gaushalas WHERE id = $1`, [entity_id]);
      if (gaushala.rows.length > 0) data = { ...data, gaushala: gaushala.rows[0] };
    }

    const { tx_hash, explorer_url } = await writeHashToChain(data);

    const network = process.env.POLYGON_NETWORK || 'amoy';
    const data_hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');

    await query(
      `INSERT INTO blockchain_records (record_type, entity_type, entity_id, tx_hash, network, data_hash, explorer_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [record_type, entity_type || null, entity_id || null, tx_hash, network, data_hash, explorer_url]
    );

    logger.info('API', 'api/blockchain/route.ts', 'Record written to chain', { record_type, tx_hash });
    return NextResponse.json({ success: true, tx_hash, explorer_url });
  } catch (err) {
    logger.error('API', 'api/blockchain/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Blockchain write failed — check wallet balance' }, { status: 500 });
  }
}
