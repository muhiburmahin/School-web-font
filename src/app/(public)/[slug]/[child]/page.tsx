import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FetchNotice } from "@/components/common/fetch-notice";
import { getPageMenu, getPublicPage } from "@/features/pages/api";
import { BlockRenderer } from "@/features/pages/components/block-renderer";
import { parsePageSlug } from "@/features/pages/document";
import { copy } from "@/i18n/server-copy";
import { withCanonical } from "@/lib/public-metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; child: string }> }): Promise<Metadata> {
  const { slug, child } = await params;
  const pageMessages = await copy("pages");
  if (!parsePageSlug(slug) || !parsePageSlug(child)) return { title: pageMessages.notFound };
  const result = await getPublicPage(child);
  if (result.status !== "success") return { title: pageMessages.notFound };
  const title = result.data.seoTitle || result.data.title;
  const description = result.data.seoDescription ?? undefined;
  return withCanonical(`/${slug}/${child}`, { title, description, openGraph: { title, description } });
}

export default async function ChildPage({ params }: { params: Promise<{ slug: string; child: string }> }) {
  const { slug, child } = await params;
  const pageMessages = await copy("pages");
  if (!parsePageSlug(slug) || !parsePageSlug(child)) notFound();
  const menu = await getPageMenu();
  if (menu.status === "success") {
    const parent = menu.data.items.find((item) => item.slug === slug);
    if (!parent || !parent.children.some((item) => item.slug === child)) notFound();
  }
  const result = await getPublicPage(child);
  if (result.status === "not-found") notFound();
  if (result.status !== "success") {
    return (
      <FetchNotice
        status={result.status}
        notFound={pageMessages.notFound}
        unavailable={pageMessages.unavailable}
        invalid={pageMessages.invalid}
        forbidden={pageMessages.forbidden}
      />
    );
  }
  return (
    <article className="grid gap-4">
      <h1 className="text-3xl font-semibold">{result.data.title}</h1>
      <BlockRenderer content={result.data.content} media={result.data.media} />
    </article>
  );
}
