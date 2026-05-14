import logger from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'gn_admin_2026';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    if (req.headers.get('x-admin-secret') !== ADMIN_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, category } = await req.json();
    if (!topic) {
      return NextResponse.json({ success: false, error: 'Topic is required' }, { status: 400 });
    }

    logger.info('API', 'wiki/generate/route.ts', 'Generating article', { topic, category });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `Write a comprehensive wiki article about "${topic}" for a platform about Indian cows and gaushalas.
Category: ${category || 'General'}

Requirements:
- Write in HTML format using only: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>
- Start directly with content, no preamble
- Include sections: Introduction, key characteristics/details, significance, practical information
- Focus on Indian context — Indian breeds, Ayurvedic significance, traditional knowledge
- Be factual, educational, and respectful of Indian cultural traditions
- Length: 400-600 words

Also provide:
- A one-sentence summary (plain text, no HTML)
- A URL-friendly slug (lowercase, hyphens only)

Respond in this exact JSON format with no markdown:
{"title": "...", "slug": "...", "summary": "...", "content": "..."}`
          }
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('API', 'wiki/generate/route.ts', 'Claude API error', { status: response.status, data });
      return NextResponse.json({ success: false, error: 'AI generation failed' }, { status: 500 });
    }

    const text = data.content?.[0]?.text || '';
    let parsed;
    try {
      // Strip markdown fences if present
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      logger.error('API', 'wiki/generate/route.ts', 'Failed to parse Claude response', { text: text.slice(0, 500), err: String(parseErr) });
      return NextResponse.json({ success: false, error: 'Failed to parse AI response', debug: String(parseErr) }, { status: 500 });
    }

    logger.info('API', 'wiki/generate/route.ts', 'Article generated', { topic, slug: parsed.slug });
    return NextResponse.json({ success: true, article: parsed });
  } catch (err) {
    logger.error('API', 'wiki/generate/route.ts', 'Generation failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Generation failed' }, { status: 500 });
  }
}
