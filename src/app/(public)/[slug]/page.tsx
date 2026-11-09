import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FetchNotice } from "@/components/common/fetch-notice";
import { BlockRenderer } from "@/features/pages/components/block-renderer";
import { getPublicPage } from "@/features/pages/api";
import { parsePageSlug } from "@/features/pages/document";
import { copy } from "@/i18n/server-copy";
import { getLocale } from "next-intl/server";
import { publishedNotices } from "@/lib/published-notices";
import { previewHref, requestDevSiteSlug } from "@/lib/tenant-host";
import { withCanonical } from "@/lib/public-metadata";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "notice-board") {
    const text = await copy("notices");
    return withCanonical("/notices", { title: text.title });
  }
  const pageMessages = await copy("pages");
  if (!parsePageSlug(slug)) return { title: pageMessages.notFound };
  const result = await getPublicPage(slug);
  if (result.status !== "success") return { title: pageMessages.notFound };
  const title = result.data.seoTitle || result.data.title;
  const description = result.data.seoDescription ?? undefined;
  return withCanonical(`/${slug}`, { title, description, openGraph: { title, description } });
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageMessages = await copy("pages");
  if (!parsePageSlug(slug)) notFound();
  if (slug === "notice-board") {
    const previewSlug = await requestDevSiteSlug();
    redirect(previewHref(previewSlug ? `/preview/${previewSlug}` : "", "/notices"));
  }
  const result = await getPublicPage(slug);
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
  const [locale, previewSlug] = await Promise.all([getLocale(), requestDevSiteSlug()]);
  const notices = result.data.content.blocks.some((block) => block.type === "notice-list") ? await publishedNotices(locale, 6) : [];
  return (
    <article className="grid gap-6">
      <h1 className={result.data.content.blocks.some((block) => block.type === "heading" || block.type === "hero" || block.type === "section") ? "sr-only" : "text-3xl font-semibold"}>{result.data.title}</h1>
      <BlockRenderer content={result.data.content} media={result.data.media} notices={notices} noticeHref={previewHref(previewSlug ? `/preview/${previewSlug}` : "", "/notices")} />
    </article>
  );
}
