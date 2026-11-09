import { EmptyState } from "@/components/common/empty-state";
import { ExternalLink, SafeLink } from "@/components/safe/safe-link";
import { linkCategories } from "@/lib/validation/query";
import { byLocale } from "@/i18n/text";
import { externalLinkPageHref, linkLabel, type ExternalLinkQuery } from "../schemas";
import { externalLinkMessages } from "../messages";
import type { ExternalLink as ExternalLinkRecord } from "../types";

export function LinkFilters({
  base,
  query,
  messages = externalLinkMessages,
}: {
  base: "/external-links" | "/admin/external-links";
  query: ExternalLinkQuery;
  messages?: typeof externalLinkMessages;
}) {
  const externalLinkMessagesLocal = messages;
  return (
      <nav aria-label={externalLinkMessagesLocal.filterLabel}>
      <ul className="flex flex-wrap gap-3 text-sm">
        <li>
          <SafeLink href={externalLinkPageHref(base, { ...query, cursor: null, category: null }, null)}>{externalLinkMessagesLocal.allCategories}</SafeLink>
        </li>
        {linkCategories.map((category) => (
          <li key={category}>
            <SafeLink href={externalLinkPageHref(base, { ...query, cursor: null, category }, null)}>
              {externalLinkMessagesLocal.categories[category]}
            </SafeLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LinkList({
  items,
  detailBase,
  nextHref,
  locale = "en",
  messages = externalLinkMessages,
}: {
  items: ExternalLinkRecord[];
  detailBase: "/external-links" | "/admin/external-links";
  nextHref: string | null;
  locale?: string;
  messages?: typeof externalLinkMessages;
}) {
  if (items.length === 0) return <EmptyState title={messages.empty} />;
  return (
    <div className="grid gap-4">
      <ul className="grid gap-3">
        {items.map((item) => (
          <li className="grid gap-1 rounded-lg border p-3" key={item.id}>
            <SafeLink href={`${detailBase}/${item.id}`}>{linkLabel(byLocale(locale, item.labelBn, item.labelEn)) || messages.title}</SafeLink>
            <ExternalLink href={item.url}>{linkLabel(item.url)}</ExternalLink>
            <p className="text-sm text-muted-foreground">{messages.categories[item.category]}</p>
            {item.isActive ? null : <p className="text-sm text-muted-foreground">{messages.inactive}</p>}
          </li>
        ))}
      </ul>
      {nextHref ? <SafeLink href={nextHref}>{messages.next}</SafeLink> : null}
    </div>
  );
}
