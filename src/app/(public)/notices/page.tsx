import type { Metadata } from "next";
import { FetchNotice } from "@/components/common/fetch-notice";
import { copy } from "@/i18n/server-copy";
import { fetchPublic } from "@/lib/data/public";
import { httpsUrl, recordList, textOf } from "@/features/content/safe-url";
import { getLocale } from "next-intl/server";
import { withCanonical } from "@/lib/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const text = await copy("notices");
  return withCanonical("/notices", { title: text.title });
}

export default async function NoticesPage() {
  const [text, locale, result] = await Promise.all([copy("notices"), getLocale(), fetchPublic("/api/v1/notices", 30, "notices")]);
  const items = result.status === "success" ? recordList(result.data) : null;
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      {result.status !== "success" ? <FetchNotice status={result.status} notFound={text.notFound} unavailable={text.unavailable} invalid={text.invalid} forbidden={text.forbidden} /> : null}
      {result.status === "success" && !items ? <FetchNotice status="invalid-response" notFound={text.notFound} unavailable={text.unavailable} invalid={text.invalid} forbidden={text.forbidden} /> : null}
      {items && items.length === 0 ? <p className="rounded-2xl border bg-card px-5 py-8 text-muted-foreground">{text.empty}</p> : null}
      <div className="grid gap-3">
      {items?.map((notice) => {
        const attachment = httpsUrl(notice.attachmentUrl);
        const category = textOf(notice.categoryName) || textOf(notice.category);
        return (
          <article key={textOf(notice.id)} className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
            <h2 className="text-lg font-semibold">{textOf(notice.title)}</h2>
            <p className="text-sm text-muted-foreground">{[category, textOf(notice.noticeDate)].filter(Boolean).join(" · ")}</p>
            {textOf(notice.summary) ? <p className="mt-2 whitespace-pre-wrap">{textOf(notice.summary)}</p> : null}
            {attachment ? <a className="mt-3 inline-block font-medium text-primary underline-offset-4 hover:underline" href={attachment} rel="noopener noreferrer">{text.download}</a> : null}
          </article>
        );
      })}
      </div>
    </section>
  );
}
