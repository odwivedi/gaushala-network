export const dynamic = 'force-dynamic';
import logger from '@/lib/logger';
import { query } from '@/lib/db-postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [articles, scripture, gaushalas, festivals] = await Promise.all([
      query(`SELECT id, title, slug, trust_level, updated_at FROM articles WHERE status != 'deleted' ORDER BY updated_at DESC LIMIT 1`),
      query(`SELECT sr.id, sr.shloka, sr.meaning_english, sr.created_at, ss.name as source_name, ss.category FROM scripture_refs sr JOIN scripture_sources ss ON sr.source_id = ss.id ORDER BY sr.created_at DESC LIMIT 1`),
      query(`SELECT id, name, state, district, is_verified, cow_count FROM gaushalas WHERE is_claimed = true ORDER BY updated_at DESC LIMIT 1`),
      query(`SELECT id, name, name_local, region, date_description FROM festivals ORDER BY id DESC LIMIT 1`),
    ]);

    const items = [];

    if (articles.rows.length > 0) {
      const a = articles.rows[0];
      items.push({
        tag: 'Wiki',
        tagBg: '#EAF3DE',
        tagColor: '#2d5a0e',
        title: a.title,
        meta: a.trust_level === 'ai_generated' ? 'AI-generated · pending verification' : 'Human verified',
        href: `/wiki/${a.slug}`,
      });
    }

    if (scripture.rows.length > 0) {
      const s = scripture.rows[0];
      items.push({
        tag: 'Scripture',
        tagBg: '#FAEEDA',
        tagColor: '#633806',
        title: `${s.source_name} — ${s.meaning_english?.slice(0, 60)}...`,
        meta: 'Sanskrit · Hindi · English · Source cited',
        href: '/scripture',
      });
    }

    if (gaushalas.rows.length > 0) {
      const g = gaushalas.rows[0];
      items.push({
        tag: 'Directory',
        tagBg: '#E8F4FD',
        tagColor: '#1a5276',
        title: `${g.name} — listing claimed${g.is_verified ? ' and verified' : ''}`,
        meta: `${g.state}${g.district ? ' · ' + g.district : ''}${g.cow_count ? ' · ' + g.cow_count + ' cows' : ''}${g.is_verified ? ' · Verified member' : ''}`,
        href: `/directory/${g.id}`,
      });
    }

    if (festivals.rows.length > 0) {
      const f = festivals.rows[0];
      items.push({
        tag: 'Culture',
        tagBg: '#F9EBEA',
        tagColor: '#78281f',
        title: `${f.name}${f.name_local ? ' — ' + f.name_local : ''}`,
        meta: `${f.region} · ${f.date_description}`,
        href: '/culture',
      });
    }

    logger.info('API', 'recent/route.ts', 'Recent items fetched', { count: items.length });
    return NextResponse.json({ success: true, items });
  } catch (err) {
    logger.error('API', 'recent/route.ts', 'GET failed', { err: String(err) });
    return NextResponse.json({ success: false, items: [] });
  }
}
