import { EmptyState } from "@/components/common/empty-state";
import { SafeImage } from "@/components/safe/safe-image";
import { SafeLink } from "@/components/safe/safe-link";
import { byLocale } from "@/i18n/text";
import { mediaFilename } from "../schemas";
import { mediaMessages } from "../messages";
import type { MediaAsset } from "../types";

export function MediaList({
  items,
  detailBase,
  nextHref,
  locale = "en",
  messages = mediaMessages,
}: {
  items: MediaAsset[];
  detailBase: "/media" | "/admin/media";
  nextHref: string | null;
  locale?: string;
  messages?: typeof mediaMessages;
}) {
  if (items.length === 0) return <EmptyState title={messages.empty} />;
  return (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {items.map((item) => {
          const name = mediaFilename(item.originalFilename) || messages.untitled;
          return (
            <li className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[4rem_1fr]" key={item.id}>
              {item.kind === "IMAGE" ? (
                <SafeImage src={item.publicUrl} alt={item.isDecorative ? "" : byLocale(locale, item.altBn, item.altEn)} fallback={messages.imageUnavailable} />
              ) : (
                <span className="text-sm text-muted-foreground">{item.kind}</span>
              )}
              <div className="min-w-0">
                <SafeLink href={`${detailBase}/${item.id}`}>{name}</SafeLink>
                <p className="truncate text-sm text-muted-foreground">{item.kind}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {nextHref ? <SafeLink href={nextHref}>{messages.next}</SafeLink> : null}
    </div>
  );
}
