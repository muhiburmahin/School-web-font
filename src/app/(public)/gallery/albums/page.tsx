import type { Metadata } from "next";
import { FetchNotice } from "@/components/common/fetch-notice";
import { httpsUrl, recordList, textOf } from "@/features/content/safe-url";
import { copy } from "@/i18n/server-copy";
import { fetchPublic } from "@/lib/data/public";
import { getLocale } from "next-intl/server";
import { withCanonical } from "@/lib/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const text = await copy("gallery");
  return withCanonical("/gallery/albums", { title: text.title });
}

export default async function GalleryAlbumsPage() {
  const [text, locale, result] = await Promise.all([copy("gallery"), getLocale(), fetchPublic("/api/v1/gallery", 30, "gallery")]);
  const items = result.status === "success" ? recordList(result.data) : null;
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      {result.status !== "success" ? <FetchNotice status={result.status} notFound={text.notFound} unavailable={text.unavailable} invalid={text.invalid} forbidden={text.forbidden} /> : null}
      {result.status === "success" && !items ? <FetchNotice status="invalid-response" notFound={text.notFound} unavailable={text.unavailable} invalid={text.invalid} forbidden={text.forbidden} /> : null}
      {items && items.length === 0 ? <p className="text-muted-foreground">{text.empty}</p> : null}
      {items?.map((album) => (
        <article key={textOf(album.id)} className="rounded-lg border p-4">
          <h2 className="text-lg font-semibold">{locale === "bn" ? textOf(album.titleBn) : textOf(album.titleEn)}</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Array.isArray(album.items) ? album.items.map((item) => {
              if (!item || typeof item !== "object") return null;
              const src = httpsUrl((item as { publicUrl?: unknown }).publicUrl);
              if (!src) return null;
              return <img key={textOf((item as { mediaId?: unknown }).mediaId)} src={src} alt="" className="h-40 w-full rounded object-cover" />;
            }) : null}
          </div>
        </article>
      ))}
    </section>
  );
}
