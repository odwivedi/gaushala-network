import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question)
      return NextResponse.json({ success: false, error: 'Question is required' }, { status: 400 });

    if (!ANTHROPIC_API_KEY)
      return NextResponse.json({ success: false, error: 'AI service not configured' }, { status: 503 });

    logger.info('API', 'ai/ask/route.ts', 'Question received', { question: question.slice(0, 100) });

    // Fetch relevant wiki articles as context
    const articles = await query(
      `SELECT a.title, a.summary FROM articles a
       ORDER BY a.updated_at DESC LIMIT 20`
    );

    const context = articles.rows
      .map(a => `Title: ${a.title}\nSummary: ${a.summary || 'No summary'}`)
      .join('\n\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
      parsed = JSON.parse(text);
    } catch {
      logger.error('API', 'ai/ask/route.ts', 'Parse failed', { text: text.slice(0, 200) });
      return NextResponse.json({ success: false, error: 'Failed to parse AI response' }, { status: 500 });
    }

    logger.info('API', 'ai/ask/route.ts', 'Question answered', { confidence: parsed.confidence });
    return NextResponse.json({ success: true, result: parsed });
  } catch (err) {
    logger.error('API', 'ai/ask/route.ts', 'Failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Q&A failed' }, { status: 500 });
  }
}
