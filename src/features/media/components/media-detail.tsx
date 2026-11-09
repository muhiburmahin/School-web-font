import { SafeImage } from "@/components/safe/safe-image";
import { SafeLink } from "@/components/safe/safe-link";
import { byLocale } from "@/i18n/text";
import { mediaFilename } from "../schemas";
import { mediaMessages } from "../messages";
import type { MediaAsset } from "../types";

export function MediaDetail({
  item,
  listHref,
  locale = "en",
  messages = mediaMessages,
}: {
  item: MediaAsset;
  listHref: "/media" | "/admin/media";
  locale?: string;
  messages?: typeof mediaMessages;
}) {
  const name = mediaFilename(item.originalFilename) || messages.untitled;
  return (
    <article className="grid gap-4">
      <SafeLink href={listHref}>{messages.back}</SafeLink>
      <h1 className="break-words text-2xl font-semibold">{name}</h1>
      {item.kind === "IMAGE" ? (
        <SafeImage src={item.publicUrl} alt={item.isDecorative ? "" : byLocale(locale, item.altBn, item.altEn)} fallback={messages.imageUnavailable} />
      ) : null}
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">{messages.kind}</dt>
          <dd>{item.kind}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.type}</dt>
          <dd className="break-all">{item.mimeType}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.size}</dt>
          <dd>{item.sizeBytes}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.width}</dt>
          <dd>{item.width ?? messages.none}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.height}</dt>
          <dd>{item.height ?? messages.none}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.duration}</dt>
          <dd>{item.durationSeconds ?? messages.none}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.altEn}</dt>
          <dd className="break-words">{item.altEn ?? messages.none}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.altBn}</dt>
          <dd className="break-words">{item.altBn ?? messages.none}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.decorative}</dt>
          <dd>{item.isDecorative ? messages.yes : messages.no}</dd>
        </div>
      </dl>
    </article>
  );
}
