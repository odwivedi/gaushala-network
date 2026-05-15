import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { getSessionFromRequest } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ success: false, error: 'Login required' }, { status: 401 });

    const result = await query(
      `SELECT id, question, answer, related_topics, confidence, created_at
       FROM qa_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [session.id]
    );

    return NextResponse.json({ success: true, history: result.rows });
  } catch (err) {
    logger.error('API', 'ai/ask/route.ts', 'GET history failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question)
      return NextResponse.json({ success: false, error: 'Question is required' }, { status: 400 });

    if (!ANTHROPIC_API_KEY)
      return NextResponse.json({ success: false, error: 'AI service not configured' }, { status: 503 });

    logger.info('API', 'ai/ask/route.ts', 'Question received', { question: question.slice(0, 100) });

    const articles = await query(
      `SELECT a.title, a.summary FROM articles a ORDER BY a.updated_at DESC LIMIT 20`
    );

    const context = articles.rows
      .map((a: {title:string;summary:string}) => `Title: ${a.title}\nSummary: ${a.summary || 'No summary'}`)
      .join('\n\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a knowledgeable assistant for gaushala.network — a platform about Indian cows, gaushalas, Vedic traditions, and cow care.

Knowledge base context (available articles):
${context}

User question: ${question}

Answer the question drawing on your knowledge of Indian cattle, Ayurveda, Vedic traditions, gaushala management, and cow care. If the question relates to an article in the knowledge base, reference it. Be concise, accurate, and respectful of Indian cultural traditions.

Respond in this exact JSON format with no markdown:
{
  "answer": "your answer here",
  "related_topics": ["topic 1", "topic 2"],
  "confidence": "high|medium|low"
}`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('API', 'ai/ask/route.ts', 'Claude API error', { status: response.status });
      return NextResponse.json({ success: false, error: 'AI service error' }, { status: 500 });
    }

    const text = data.content?.[0]?.text || '';
    let parsed;
    try {
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      logger.error('API', 'ai/ask/route.ts', 'Parse failed', { text: text.slice(0, 200), err: String(parseErr) });
      return NextResponse.json({ success: false, error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Save to history if user is logged in
    try {
      const session = await getSessionFromRequest(req);
      if (session) {
        await query(
          `INSERT INTO qa_history (user_id, question, answer, related_topics, confidence)
           VALUES ($1, $2, $3, $4, $5)`,
          [session.id, question, parsed.answer, parsed.related_topics || [], parsed.confidence || 'medium']
        );
        logger.info('API', 'ai/ask/route.ts', 'Q&A saved to history', { user_id: session.id });
      }
    } catch { /* silent — saving history is optional */ }

    logger.info('API', 'ai/ask/route.ts', 'Question answered', { confidence: parsed.confidence });
    return NextResponse.json({ success: true, result: parsed });
  } catch (err) {
    logger.error('API', 'ai/ask/route.ts', 'Failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Q&A failed' }, { status: 500 });
  }
}
