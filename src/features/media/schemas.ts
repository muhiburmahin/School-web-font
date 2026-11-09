import { z } from "zod";
import { backendContract } from "@/config/backend-contract";
import { parseRecordId } from "@/lib/validation/identifiers";
import { parseCursor, type ListQuery } from "@/lib/validation/query";
import { safeHttpUrl } from "@/lib/validation/url";
import { truncateText } from "@/lib/validation/text";
import type { MediaAsset, MediaList } from "./types";

const mediaAssetSchema = z.object({
  id: z.string().refine((value) => parseRecordId(value) !== null),
  kind: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
  publicUrl: z.string().nullable().transform((value) => safeHttpUrl(value)),
  mimeType: z.string().max(255),
  originalFilename: z.string().max(255),
  sizeBytes: z.number().int().nonnegative(),
  width: z.number().int().nonnegative().nullable(),
  height: z.number().int().nonnegative().nullable(),
  durationSeconds: z.number().int().nonnegative().nullable(),
  altBn: z.string().nullable(),
  altEn: z.string().nullable(),
  isDecorative: z.boolean(),
});

export function parseMediaAsset(value: unknown): MediaAsset | null {
  const parsed = mediaAssetSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseMediaList(value: unknown): MediaList | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (!Array.isArray(row.items)) return null;
  if (row.nextCursor !== null && typeof row.nextCursor !== "string") return null;
  const items: MediaAsset[] = [];
  for (const item of row.items) {
    const parsed = parseMediaAsset(item);
    if (!parsed) return null;
    items.push(parsed);
  }
  return { items, nextCursor: parseCursor(row.nextCursor ?? undefined) };
}

export function mediaListPath(query: ListQuery): string {
  const params = new URLSearchParams();
  params.set("limit", String(query.limit));
  if (query.cursor) params.set("cursor", query.cursor);
  return `${backendContract.media.list.path}?${params.toString()}`;
}

export function mediaDetailPath(id: string): string {
  return backendContract.media.detail.path.replace(":id", encodeURIComponent(id));
}

export function mediaPageHref(base: "/media" | "/admin/media", query: ListQuery, cursor: string | null): string {
  const params = new URLSearchParams();
  if (query.limit !== backendContract.pagination.limitDefault) params.set("limit", String(query.limit));
  if (cursor) params.set("cursor", cursor);
  const search = params.toString();
  return search ? `${base}?${search}` : base;
}

export function mediaFilename(value: string): string {
  const trimmed = value.trim();
  return truncateText(trimmed || "", 120);
}
