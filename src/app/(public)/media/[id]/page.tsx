import { notFound } from "next/navigation";
import { FetchNotice } from "@/components/common/fetch-notice";
import { getMedia } from "@/features/media/api";
import { MediaDetail } from "@/features/media/components/media-detail";
import { copy } from "@/i18n/server-copy";
import { getLocale } from "next-intl/server";
import { parseRecordId } from "@/lib/validation/identifiers";

export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseRecordId(rawId);
  if (!id) notFound();
  const [result, mediaMessages, locale] = await Promise.all([getMedia(id), copy("media"), getLocale()]);
  if (result.status === "not-found") notFound();
  if (result.status !== "success") {
    return (
      <FetchNotice
        status={result.status}
        notFound={mediaMessages.notFound}
        unavailable={mediaMessages.unavailable}
        invalid={mediaMessages.invalid}
        forbidden={mediaMessages.forbidden}
      />
    );
  }
  return <MediaDetail item={result.data} listHref="/media" locale={locale} messages={mediaMessages} />;
}
