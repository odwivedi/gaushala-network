import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { saveArticleContent } from '@/lib/db-mongo';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let sql = `SELECT a.id, a.title, a.slug, a.summary, a.status, a.trust_level, a.created_at, a.updated_at,
               c.name as category_name, c.slug as category_slug
               FROM articles a
               LEFT JOIN article_categories c ON a.category_id = c.id
               WHERE a.status != 'deleted'`;
    const params: unknown[] = [];

    if (category) {
      params.push(category);
      sql += ` AND c.slug = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (a.title ILIKE $${params.length} OR a.summary ILIKE $${params.length})`;
    }

    sql += ` ORDER BY a.updated_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await query(sql, params);
    logger.info('API', 'wiki/route.ts', 'Articles listed', { count: result.rows.length });
    return NextResponse.json({ success: true, articles: result.rows });
  } catch (err) {
    logger.error('API', 'wiki/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, category_id, summary, content } = body;

    if (!title || !slug) {
      return NextResponse.json({ success: false, error: 'title and slug are required' }, { status: 400 });
    }

    const mongoId = await saveArticleContent(content || '');

    const result = await query(
      `INSERT INTO articles (title, slug, category_id, summary, mongo_content_id, status, trust_level)
       VALUES ($1, $2, $3, $4, $5, 'draft', 'ai_generated') RETURNING *`,
      [title, slug, category_id || null, summary || null, mongoId]
    );

    const article = result.rows[0];

    await query(
      `INSERT INTO article_revisions (article_id, mongo_content_id, edit_summary, trust_level)
       VALUES ($1, $2, $3, $4)`,
      [article.id, mongoId, 'Initial version', 'ai_generated']
    );

    logger.info('API', 'wiki/route.ts', 'Article created', { id: article.id, slug });
    return NextResponse.json({ success: true, article }, { status: 201 });
  } catch (err) {
    logger.error('API', 'wiki/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to create article' }, { status: 500 });
  }
}
