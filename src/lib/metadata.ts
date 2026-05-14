import { Metadata } from 'next';
import { query } from '@/lib/db-postgres';

export async function generateWikiMetadata(slug: string): Promise<Metadata> {
  try {
    const result = await query(
      `SELECT a.title, a.summary, ac.name as category_name
       FROM articles a
       LEFT JOIN article_categories ac ON a.category_id = ac.id
       WHERE a.slug = $1 AND a.status != 'deleted'`,
      [slug]
    );
    if (result.rows.length === 0) return {};
    const article = result.rows[0];
    return {
      title: article.title,
      description: article.summary || `Learn about ${article.title} on gaushala.network`,
      openGraph: {
        title: article.title,
        description: article.summary || `Learn about ${article.title} on gaushala.network`,
        url: `https://gaushala.network/wiki/${slug}`,
        type: 'article',
      },
      twitter: {
        card: 'summary',
        title: article.title,
        description: article.summary || `Learn about ${article.title} on gaushala.network`,
      },
    };
  } catch {
    return {};
  }
}
