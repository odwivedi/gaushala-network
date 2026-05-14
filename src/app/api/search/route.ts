import logger from '@/lib/logger';
import { searchAll, setupIndexes } from '@/lib/search';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get('q') || '';

    if (!q.trim())
      return NextResponse.json({ success: true, results: [] });

    const results = await searchAll(q, 10);

    logger.info('API', 'api/search/route.ts', 'Search query', { q, resultSets: results.length });
    return NextResponse.json({ success: true, results });
  } catch (err) {
    logger.error('API', 'api/search/route.ts', 'Search failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Search failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    if (action === 'setup') {
      await setupIndexes();
      return NextResponse.json({ success: true, message: 'Indexes set up' });
    }
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    logger.error('API', 'api/search/route.ts', 'POST failed', { err: String(err) });
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
  }
}
