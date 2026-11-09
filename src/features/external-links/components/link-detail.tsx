import { ExternalLink, SafeLink } from "@/components/safe/safe-link";
import { byLocale } from "@/i18n/text";
import { linkLabel } from "../schemas";
import { externalLinkMessages } from "../messages";
import type { ExternalLink as ExternalLinkRecord } from "../types";

export function LinkDetail({
  item,
  listHref,
  locale = "en",
  messages = externalLinkMessages,
}: {
  item: ExternalLinkRecord;
  listHref: "/external-links" | "/admin/external-links";
  locale?: string;
  messages?: typeof externalLinkMessages;
}) {
  return (
    <article className="grid gap-4">
      <SafeLink href={listHref}>{messages.back}</SafeLink>
      <h1 className="break-words text-2xl font-semibold">{linkLabel(byLocale(locale, item.labelBn, item.labelEn)) || messages.title}</h1>
      <ExternalLink href={item.url}>{linkLabel(item.url)}</ExternalLink>
      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">{messages.filterLabel}</dt>
          <dd>{messages.categories[item.category]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.active}</dt>
          <dd>{item.isActive ? messages.active : messages.inactive}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{messages.sortOrder}</dt>
          <dd>{item.sortOrder}</dd>
        </div>
      </dl>
    </article>
  );
}
