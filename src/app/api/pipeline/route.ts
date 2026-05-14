import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'gn_admin_2026';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

async function claudeHaiku(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

export async function GET(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET)
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const jobs = await query(`SELECT * FROM pipeline_jobs ORDER BY started_at DESC LIMIT 20`);
  return NextResponse.json({ success: true, jobs: jobs.rows });
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== ADMIN_SECRET)
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  const { action } = await req.json();

  if (action === 'auto_categorise') {
    const jobResult = await query(
      `INSERT INTO pipeline_jobs (job_name, status) VALUES ('auto_categorise', 'running') RETURNING id`
    );
    const jobId = jobResult.rows[0].id;

    // Get categories
    const cats = await query(`SELECT id, name FROM article_categories ORDER BY name`);
    const catList = cats.rows.map((c: {id:number;name:string}) => `${c.id}: ${c.name}`).join(', ');

    // Get articles with no category
    const articles = await query(
      `SELECT id, title, summary FROM articles WHERE category_id IS NULL AND status != 'deleted'`
    );

    let succeeded = 0;
    let failed = 0;

    for (const article of articles.rows) {
      try {
        const prompt = `Given these article categories: ${catList}
Article title: "${article.title}"
Article summary: "${article.summary || ''}"
Reply with ONLY the category ID number (just the number, nothing else) that best fits this article.`;

        const response = await claudeHaiku(prompt);
        const catId = parseInt(response.trim());

        if (!isNaN(catId)) {
          await query(`UPDATE articles SET category_id = $1 WHERE id = $2`, [catId, article.id]);
          succeeded++;
          logger.info('PIPELINE', 'pipeline/route.ts', 'Article categorised', { id: article.id, catId });
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    await query(
      `UPDATE pipeline_jobs SET status = 'completed', records_attempted = $1, records_succeeded = $2, records_failed = $3, completed_at = NOW() WHERE id = $4`,
      [articles.rows.length, succeeded, failed, jobId]
    );

    logger.info('PIPELINE', 'pipeline/route.ts', 'Auto-categorise complete', { succeeded, failed });
    return NextResponse.json({ success: true, succeeded, failed });

  } else if (action === 'quality_check') {
    const jobResult = await query(
      `INSERT INTO pipeline_jobs (job_name, status) VALUES ('quality_check', 'running') RETURNING id`
    );
    const jobId = jobResult.rows[0].id;

    const articles = await query(
      `SELECT id, title, summary FROM articles WHERE trust_level = 'ai_generated' AND status != 'deleted'`
    );

    let succeeded = 0;
    let failed = 0;

    for (const article of articles.rows) {
      try {
        const prompt = `Rate the quality of this article for a knowledge platform about Indian cows and gaushalas.
Title: "${article.title}"
Summary: "${article.summary || ''}"
Reply with ONLY a JSON object like: {"score": 7, "flag": false, "reason": "brief reason"}
Score is 1-10. Flag is true if the article needs human review urgently.`;

        const response = await claudeHaiku(prompt);
        const clean = response.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(clean);

        if (parsed.flag) {
          await query(
            `INSERT INTO article_flags (article_id, reason, note, status) VALUES ($1, 'quality', $2, 'open')`,
            [article.id, parsed.reason || 'Low quality AI content']
          );
        }
        succeeded++;
        logger.info('PIPELINE', 'pipeline/route.ts', 'Quality checked', { id: article.id, score: parsed.score, flag: parsed.flag });
      } catch {
        failed++;
      }
    }

    await query(
      `UPDATE pipeline_jobs SET status = 'completed', records_attempted = $1, records_succeeded = $2, records_failed = $3, completed_at = NOW() WHERE id = $4`,
      [articles.rows.length, succeeded, failed, jobId]
    );

    logger.info('PIPELINE', 'pipeline/route.ts', 'Quality check complete', { succeeded, failed });
    return NextResponse.json({ success: true, succeeded, failed });

  } else {
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  }
}
