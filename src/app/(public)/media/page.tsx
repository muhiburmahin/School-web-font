import { FetchNotice } from "@/components/common/fetch-notice";
import { getMediaList } from "@/features/media/api";
import { MediaList } from "@/features/media/components/media-list";
import { copy } from "@/i18n/server-copy";
import { getLocale } from "next-intl/server";
import { mediaPageHref } from "@/features/media/schemas";
import { parseListQuery, type SearchParamsInput } from "@/lib/validation/query";

export default async function MediaPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const query = parseListQuery(await searchParams);
  const [result, mediaMessages, locale] = await Promise.all([getMediaList(query), copy("media"), getLocale()]);
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">{mediaMessages.title}</h1>
      {result.status === "success" ? (
          <MediaList
          items={result.data.items}
          detailBase="/media"
          locale={locale}
          messages={mediaMessages}
          nextHref={result.data.nextCursor ? mediaPageHref("/media", query, result.data.nextCursor) : null}
        />
      ) : (
        <FetchNotice
          status={result.status}
          notFound={mediaMessages.notFound}
          unavailable={mediaMessages.unavailable}
          invalid={mediaMessages.invalid}
          forbidden={mediaMessages.forbidden}
        />
      )}
    </section>
  );
}
