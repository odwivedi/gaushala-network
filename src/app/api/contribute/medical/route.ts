import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db-postgres';
import { getSessionFromRequest } from '@/lib/auth';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'gn_admin_2026';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, content, expert_name, qualification, institution, experience_years, youtube_urls, media_urls } = body;

    if (!title || !content || !expert_name || !qualification) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // AI check via Anthropic
    let ai_score = 0;
    let ai_reasoning = '';
    try {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Analyze this text and estimate the probability it was AI-generated (0-100). Return ONLY valid JSON with no markdown: {"score": <number 0-100>, "reasoning": "<2-3 sentence explanation>"}

Text to analyze:
${content.substring(0, 2000)}`
          }]
        })
      });
      const aiData = await aiRes.json();
      const rawText = aiData.content?.[0]?.text || '{"score":0,"reasoning":"Analysis unavailable"}';
      const cleaned = rawText.replace(/\`\`\`json|\`\`\`/g, '').trim();
      const parsed = JSON.parse(cleaned);
      ai_score = parsed.score || 0;
      ai_reasoning = parsed.reasoning || '';
    } catch (aiErr) {
      logger.error('CONTRIBUTE', 'contribute/medical/route.ts', 'AI check failed', { err: String(aiErr) });
    }

    
    const result = await pool.query(
      `INSERT INTO expert_contributions
       (contributor_id, contribution_type, title, content, expert_name, qualification, institution, experience_years, youtube_urls, ai_score, ai_reasoning, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending') RETURNING id`,
      [user.id, 'medical', title, content, expert_name, qualification, institution || null, experience_years || null, youtube_urls || [], ai_score, ai_reasoning]
    );

    const contributionId = result.rows[0].id;

    // Link any pre-uploaded media
    if (media_urls && media_urls.length > 0) {
      for (const url of media_urls) {
        const fileType = url.includes('/pdfs/') ? 'pdf' : 'image';
        await pool.query(
          `INSERT INTO media_attachments (entity_type, entity_id, file_type, file_url, uploaded_by) VALUES ($1, $2, $3, $4, $5)`,
          ['expert_contribution', contributionId, fileType, url, user.id]
        );
      }
    }

    logger.info('CONTRIBUTE', 'contribute/medical/route.ts', 'Medical contribution submitted', { contributionId, userId: user.id, ai_score });

    return NextResponse.json({ success: true, id: contributionId, ai_score });
  } catch (err) {
    logger.error('CONTRIBUTE', 'contribute/medical/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    
    const result = await pool.query(
      `SELECT ec.*, u.display_name as contributor_name, u.email as contributor_email,
       json_agg(json_build_object('url', ma.file_url, 'type', ma.file_type)) FILTER (WHERE ma.id IS NOT NULL) as media
       FROM expert_contributions ec
       LEFT JOIN users u ON u.id = ec.contributor_id
       LEFT JOIN media_attachments ma ON ma.entity_type = 'expert_contribution' AND ma.entity_id = ec.id
       WHERE ec.contribution_type = 'medical'
       GROUP BY ec.id, u.display_name, u.email
       ORDER BY ec.created_at DESC`
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    logger.error('CONTRIBUTE', 'contribute/medical/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
