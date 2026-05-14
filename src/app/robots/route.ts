import { NextResponse } from 'next/server';

export async function GET() {
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register

Sitemap: https://gaushala.network/sitemap
`;
  return new NextResponse(content, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
