import { query } from '@/lib/db-postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://gaushala.network';

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/wiki', priority: '0.9', changefreq: 'daily' },
    { url: '/directory', priority: '0.9', changefreq: 'daily' },
    { url: '/scripture', priority: '0.8', changefreq: 'weekly' },
    { url: '/jyotish', priority: '0.7', changefreq: 'weekly' },
    { url: '/culture', priority: '0.7', changefreq: 'weekly' },
    { url: '/community', priority: '0.7', changefreq: 'daily' },
    { url: '/ask', priority: '0.8', changefreq: 'monthly' },
    { url: '/symptom-checker', priority: '0.8', changefreq: 'monthly' },
  ];

  let articleUrls = '';
  try {
    const articles = await query(
      `SELECT slug, updated_at FROM articles WHERE status != 'deleted' ORDER BY updated_at DESC`
    );
    articleUrls = articles.rows.map((a: {slug:string;updated_at:string}) => `
  <url>
    <loc>${baseUrl}/wiki/${a.slug}</loc>
    <lastmod>${new Date(a.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('');
  } catch { /* ignore */ }

  let gaushalaUrls = '';
  try {
    const gaushalas = await query(
      `SELECT id, updated_at FROM gaushalas ORDER BY updated_at DESC LIMIT 500`
    );
    gaushalaUrls = gaushalas.rows.map((g: {id:number;updated_at:string}) => `
  <url>
    <loc>${baseUrl}/directory/${g.id}</loc>
    <lastmod>${new Date(g.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('');
  } catch { /* ignore */ }

  const staticUrls = staticPages.map(p => `
  <url>
    <loc>${baseUrl}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
${gaushalaUrls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
