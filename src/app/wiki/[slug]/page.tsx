import { generateWikiMetadata } from '@/lib/metadata';
import { Metadata } from 'next';
import WikiArticleClient from './WikiArticleClient';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return generateWikiMetadata(params.slug);
}

export default function WikiArticlePage() {
  return <WikiArticleClient />;
}
