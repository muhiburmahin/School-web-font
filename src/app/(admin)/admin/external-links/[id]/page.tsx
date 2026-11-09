import { notFound } from "next/navigation";
import { FetchNotice } from "@/components/common/fetch-notice";
import { getAdminExternalLink } from "@/features/external-links/api";
import { LinkChangesNotice } from "@/features/external-links/components/changes-notice";
import { LinkDetail } from "@/features/external-links/components/link-detail";
import { externalLinkMessages } from "@/features/external-links/messages";
import { parseRecordId } from "@/lib/validation/identifiers";

export default async function AdminExternalLinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseRecordId(rawId);
  if (!id) notFound();
  const result = await getAdminExternalLink(id);
  if (result.status === "not-found") notFound();
  return (
    <section className="grid gap-4">
      <LinkChangesNotice />
      {result.status === "success" ? (
        <LinkDetail item={result.data} listHref="/admin/external-links" />
      ) : (
        <FetchNotice
          status={result.status}
          notFound={externalLinkMessages.notFound}
          unavailable={externalLinkMessages.unavailable}
          invalid={externalLinkMessages.invalid}
          forbidden={externalLinkMessages.forbidden}
        />
      )}
    </section>
  );
}
