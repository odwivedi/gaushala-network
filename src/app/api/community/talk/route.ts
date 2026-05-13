import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const entity_type = searchParams.get('entity_type');
    const entity_id = searchParams.get('entity_id');
    const thread_id = searchParams.get('thread_id');

    if (thread_id) {
      const messages = await query(
        `SELECT tm.*, u.display_name, u.email, tl.name as trust_level_name
         FROM talk_messages tm
         LEFT JOIN users u ON tm.author_id = u.id
         LEFT JOIN trust_levels tl ON u.trust_level_id = tl.id
         WHERE tm.thread_id = $1 AND tm.is_deleted = false
         ORDER BY tm.created_at ASC`,
        [thread_id]
      );
      return NextResponse.json({ success: true, messages: messages.rows });
    }

    if (entity_type && entity_id) {
      const threads = await query(
        `SELECT tt.*, u.display_name as created_by_name,
                COUNT(tm.id) as message_count,
                MAX(tm.created_at) as last_activity
         FROM talk_threads tt
         LEFT JOIN users u ON tt.created_by = u.id
         LEFT JOIN talk_messages tm ON tm.thread_id = tt.id AND tm.is_deleted = false
         WHERE tt.entity_type = $1 AND tt.entity_id = $2
         GROUP BY tt.id, u.display_name
         ORDER BY last_activity DESC NULLS LAST`,
        [entity_type, entity_id]
      );
      return NextResponse.json({ success: true, threads: threads.rows });
    }

    return NextResponse.json({ success: false, error: 'entity_type and entity_id required' }, { status: 400 });
  } catch (err) {
    logger.error('API', 'community/talk/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch discussions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sign in to participate in discussions' }, { status: 401 });
    }

    const body = await req.json();
    const { entity_type, entity_id, title, content, thread_id, parent_id } = body;

    if (thread_id) {
      if (!content?.trim()) {
        return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 });
      }
      const result = await query(
        `INSERT INTO talk_messages (thread_id, content, author_id, parent_id)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [thread_id, content.trim(), user.id, parent_id || null]
      );
      await query(`UPDATE talk_threads SET updated_at = NOW() WHERE id = $1`, [thread_id]);
      logger.info('API', 'community/talk/route.ts', 'Message posted', { thread_id, user_id: user.id });
      return NextResponse.json({ success: true, message: result.rows[0] }, { status: 201 });
    }

    if (!entity_type || !entity_id || !content?.trim()) {
      return NextResponse.json({ success: false, error: 'entity_type, entity_id and content are required' }, { status: 400 });
    }

    const thread = await query(
      `INSERT INTO talk_threads (entity_type, entity_id, title, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [entity_type, parseInt(entity_id), title || null, user.id]
    );
    const message = await query(
      `INSERT INTO talk_messages (thread_id, content, author_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [thread.rows[0].id, content.trim(), user.id]
    );
    logger.info('API', 'community/talk/route.ts', 'Thread created', { entity_type, entity_id, user_id: user.id });
    return NextResponse.json({ success: true, thread: thread.rows[0], message: message.rows[0] }, { status: 201 });
  } catch (err) {
    logger.error('API', 'community/talk/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to post' }, { status: 500 });
  }
}
