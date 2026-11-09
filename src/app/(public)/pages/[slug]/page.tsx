import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicPageBySlug } from '@/features/public/actions';
import { BlockRenderer } from '@/features/pages/components/block-renderer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPageBySlug(slug);
  if (!page) return { title: 'Page Not Found' };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.title,
  };
}

export default async function PublicSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPublicPageBySlug(slug);

  if (!page) {
    notFound();
  }

  const content = page.content || { blocks: [] };
  const media = page.media || {};

  return (
    <article className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
        {page.title}
      </h1>

      {content.blocks && content.blocks.length > 0 ? (
        <BlockRenderer content={content} media={media} notices={[]} noticeHref="/notices" />
      ) : (
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
          {page.body || page.description || 'No content published on this page yet.'}
        </div>
      )}
    </article>
  );
}

