import { notFound } from "next/navigation";
import { FetchNotice } from "@/components/common/fetch-notice";
import { getExternalLinks } from "@/features/external-links/api";
import { LinkFilters, LinkList } from "@/features/external-links/components/link-list";
import { copy } from "@/i18n/server-copy";
import { getLocale } from "next-intl/server";
import { externalLinkPageHref } from "@/features/external-links/schemas";
import { firstQueryValue, parseCategory, parseListQuery, type SearchParamsInput } from "@/lib/validation/query";

export default async function ExternalLinksPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const params = await searchParams;
  const category = parseCategory(firstQueryValue(params.category));
  if (!category.ok) notFound();
  const query = { ...parseListQuery(params), category: category.category };
  const [result, messages, locale] = await Promise.all([getExternalLinks(query), copy("externalLinks"), getLocale()]);
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">{messages.title}</h1>
      <LinkFilters base="/external-links" query={query} messages={messages} />
      {result.status === "success" ? (
        <LinkList
          items={result.data.items}
          detailBase="/external-links"
          locale={locale}
          messages={messages}
          nextHref={result.data.nextCursor ? externalLinkPageHref("/external-links", query, result.data.nextCursor) : null}
        />
      ) : (
        <FetchNotice
          status={result.status}
          notFound={messages.notFound}
          unavailable={messages.unavailable}
          invalid={messages.invalid}
          forbidden={messages.forbidden}
        />
      )}
    </section>
  );
}
