import { z } from "zod";
import { backendContract } from "@/config/backend-contract";
import { parseRecordId } from "@/lib/validation/identifiers";
import { linkCategories, parseCursor, type LinkCategory, type ListQuery } from "@/lib/validation/query";
import { safeHttpsUrl } from "@/lib/validation/url";
import { truncateText } from "@/lib/validation/text";
import { externalLinkMessages } from "./messages";
import type { AdminExternalLink, ExternalLink, ExternalLinkList } from "./types";

export interface ExternalLinkQuery extends ListQuery {
  category: LinkCategory | null;
}

const externalLinkSchema = z.object({
  id: z.string().refine((value) => parseRecordId(value) !== null),
  labelBn: z.string().max(500),
  labelEn: z.string().max(500),
  url: z.string().transform((value, context) => {
    const url = safeHttpsUrl(value);
    if (!url) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "invalid url" });
      return z.NEVER;
    }
    return url;
  }),
  category: z.enum(linkCategories),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

const adminExternalLinkSchema = externalLinkSchema.extend({
  lastVerifiedAt: z.string().nullable(),
  createdById: z.string().refine((value) => parseRecordId(value) !== null),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const externalLinkFormSchema = z
  .object({
    labelBn: z.string().trim().min(1, externalLinkMessages.labelInvalid).max(200, externalLinkMessages.labelInvalid),
    labelEn: z.string().trim().min(1, externalLinkMessages.labelInvalid).max(200, externalLinkMessages.labelInvalid),
    url: z.string().refine((value) => safeHttpsUrl(value) !== null, externalLinkMessages.urlInvalid),
    category: z.enum(linkCategories, { message: externalLinkMessages.categoryInvalid }),
    sortOrder: z.number().int(externalLinkMessages.sortInvalid).min(-2147483648).max(2147483647),
  })
  .strict();

export type ExternalLinkFormValues = z.infer<typeof externalLinkFormSchema>;

export function parseExternalLink(value: unknown): ExternalLink | null {
  const parsed = externalLinkSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseExternalLinkList(value: unknown): ExternalLinkList | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!Array.isArray(row.items)) return null;
  if (row.nextCursor !== null && typeof row.nextCursor !== "string") return null;
  const items: ExternalLink[] = [];
  for (const item of row.items) {
    const parsed = parseExternalLink(item);
    if (!parsed) return null;
    items.push(parsed);
  }
  return { items, nextCursor: parseCursor(row.nextCursor ?? undefined) };
}

export function parseAdminExternalLinkList(value: unknown): ExternalLinkList | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!Array.isArray(row.items)) return null;
  if (row.nextCursor !== null && typeof row.nextCursor !== "string") return null;
  const items: AdminExternalLink[] = [];
  for (const item of row.items) {
    const parsed = adminExternalLinkSchema.safeParse(item);
    if (!parsed.success) return null;
    items.push(parsed.data);
  }
  return { items, nextCursor: parseCursor(row.nextCursor ?? undefined) };
}

export function swapSortOrders(
  items: readonly { id: string; sortOrder: number }[],
  index: number,
  direction: -1 | 1,
): { items: { id: string; sortOrder: number }[] } | null {
  const next = index + direction;
  const current = items[index];
  const neighbor = items[next];
  if (!current || !neighbor) return null;
  const currentOrder = current.sortOrder === neighbor.sortOrder ? neighbor.sortOrder + direction : neighbor.sortOrder;
  return {
    items: [
      { id: current.id, sortOrder: currentOrder },
      { id: neighbor.id, sortOrder: current.sortOrder },
    ],
  };
}

export function externalLinkListPath(query: ExternalLinkQuery): string {
  const params = new URLSearchParams();
  params.set("limit", String(query.limit));
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.category) params.set("category", query.category);
  return `${backendContract.externalLinks.list.path}?${params.toString()}`;
}

export function externalLinkDetailPath(id: string): string {
  return backendContract.externalLinks.detail.path.replace(":id", encodeURIComponent(id));
}

export function externalLinkAdminListPath(query: ExternalLinkQuery): string {
  const params = new URLSearchParams();
  params.set("limit", String(query.limit));
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.category) params.set("category", query.category);
  return `${backendContract.externalLinks.adminList.path}?${params.toString()}`;
}

export function externalLinkResourcePath(
  template: typeof backendContract.externalLinks.update.path | typeof backendContract.externalLinks.active.path | typeof backendContract.externalLinks.remove.path,
  id: string,
): string {
  return template.replace(":id", encodeURIComponent(id));
}

export function externalLinkPageHref(
  base: "/external-links" | "/admin/external-links",
  query: ExternalLinkQuery,
  cursor: string | null,
): string {
  const params = new URLSearchParams();
  if (query.limit !== backendContract.pagination.limitDefault) params.set("limit", String(query.limit));
  if (cursor) params.set("cursor", cursor);
  if (query.category) params.set("category", query.category);
  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

export function linkLabel(value: string): string {
  return truncateText(value.trim(), 160);
}
