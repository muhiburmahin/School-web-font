import { notFound } from "next/navigation";
import { FetchNotice } from "@/components/common/fetch-notice";
import { getAdminMedia } from "@/features/media/api";
import { MediaChangesNotice } from "@/features/media/components/changes-notice";
import { MediaDetail } from "@/features/media/components/media-detail";
import { mediaMessages } from "@/features/media/messages";
import { parseRecordId } from "@/lib/validation/identifiers";

export default async function AdminMediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseRecordId(rawId);
  if (!id) notFound();
  const result = await getAdminMedia(id);
  if (result.status === "not-found") notFound();
  return (
    <section className="grid gap-4">
      <MediaChangesNotice />
      {result.status === "success" ? (
        <MediaDetail item={result.data} listHref="/admin/media" />
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
