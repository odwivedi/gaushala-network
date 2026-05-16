import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-postgres';
import { getSessionFromRequest } from '@/lib/auth';
import { writeHashToChain } from '@/lib/blockchain';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user || user.trust_level_id !== 8) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const contributionId = parseInt(params.id);
    const body = await req.json();
    const { action, review_note } = body;

    if (!['approve', 'reject', 'approve_blockchain'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    

    const existing = await pool.query(
      `SELECT ec.*, u.display_name as contributor_name, u.email as contributor_email
       FROM expert_contributions ec
       LEFT JOIN users u ON u.id = ec.contributor_id
       WHERE ec.id = $1`,
      [contributionId]
    );

    if (existing.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const contribution = existing.rows[0];
    const status = action === 'reject' ? 'rejected' : 'approved';

    let blockchain_tx = null;
    let blockchain_verified = false;

    if (action === 'approve_blockchain') {
      try {
        const hashData = {
          id: contributionId,
          type: contribution.contribution_type,
          title: contribution.title,
          expert: contribution.expert_name,
          qualification: contribution.qualification,
          platform: 'gaushala.network',
          timestamp: new Date().toISOString()
        };
        const result = await writeHashToChain(hashData);
        blockchain_tx = result.tx_hash;
        blockchain_verified = true;
        logger.info('CONTRIBUTE', 'contribute/[id]/review/route.ts', 'Blockchain hash written', { contributionId, tx: blockchain_tx });
      } catch (bcErr) {
        logger.error('CONTRIBUTE', 'contribute/[id]/review/route.ts', 'Blockchain write failed', { err: String(bcErr) });
        return NextResponse.json({ error: 'Blockchain write failed' }, { status: 500 });
      }
    }

    await pool.query(
      `UPDATE expert_contributions
       SET status = $1, reviewed_by = $2, review_note = $3, reviewed_at = now(),
           blockchain_tx = $4, blockchain_verified = $5
       WHERE id = $6`,
      [status, user.id, review_note || null, blockchain_tx, blockchain_verified, contributionId]
    );

    logger.info('CONTRIBUTE', 'contribute/[id]/review/route.ts', 'Contribution reviewed', { contributionId, action, reviewedBy: user.id });

    return NextResponse.json({ success: true, status, blockchain_tx, blockchain_verified });
  } catch (err) {
    logger.error('CONTRIBUTE', 'contribute/[id]/review/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ error: 'Review failed' }, { status: 500 });
  }
}
