import { notFound } from "next/navigation";
import { FetchNotice } from "@/components/common/fetch-notice";
import { getExternalLink } from "@/features/external-links/api";
import { LinkDetail } from "@/features/external-links/components/link-detail";
import { copy } from "@/i18n/server-copy";
import { getLocale } from "next-intl/server";
import { parseRecordId } from "@/lib/validation/identifiers";

export default async function ExternalLinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseRecordId(rawId);
  if (!id) notFound();
  const [result, externalLinkMessages, locale] = await Promise.all([getExternalLink(id), copy("externalLinks"), getLocale()]);
  if (result.status === "not-found") notFound();
  if (result.status !== "success") {
    return (
      <FetchNotice
        status={result.status}
        notFound={externalLinkMessages.notFound}
        unavailable={externalLinkMessages.unavailable}
        invalid={externalLinkMessages.invalid}
        forbidden={externalLinkMessages.forbidden}
      />
    );
  }
  return <LinkDetail item={result.data} listHref="/external-links" locale={locale} messages={externalLinkMessages} />;
}
