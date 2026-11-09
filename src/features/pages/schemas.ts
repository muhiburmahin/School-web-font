import { z } from "zod";
import { backendContract } from "@/config/backend-contract";
import { pageDocumentSchema, parsePageSlug } from "./document";
import { pageMessages } from "./messages";
import type { ManagedPage, PageMenu, PageSummaryList, PublicPage } from "./types";

const media = z.record(
  z.string().uuid(),
  z.object({ kind: z.enum(["IMAGE", "VIDEO"]), publicUrl: z.string().min(1), alt: z.string().nullable() }).strict(),
);

const summary = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    slug: z.string(),
    status: z.enum(backendContract.pages.statuses),
    isSystem: z.boolean(),
    showInMenu: z.boolean(),
    sortOrder: z.number().int(),
    parentId: z.string().uuid().nullable(),
  })
  .strict();

const menuItem: z.ZodType<PageMenu["items"][number]> = z.lazy(() =>
  z.object({ title: z.string(), slug: z.string(), sortOrder: z.number().int(), children: z.array(menuItem) }).strict(),
);

export function parsePageMenu(value: unknown): PageMenu | null {
  const parsed = z.object({ items: z.array(menuItem) }).strict().safeParse(value);
  return parsed.success ? (parsed.data as PageMenu) : null;
}

export function parsePageSummaryList(value: unknown): PageSummaryList | null {
  const parsed = z.object({ items: z.array(summary), nextCursor: z.string().nullable() }).strict().safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseManagedPage(value: unknown): ManagedPage | null {
  const parsed = summary
    .extend({ seoTitle: z.string().nullable(), seoDescription: z.string().nullable(), content: pageDocumentSchema, media })
    .strict()
    .safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parsePublicPage(value: unknown): PublicPage | null {
  const parsed = z
    .object({
      title: z.string(),
      slug: z.string(),
      seoTitle: z.string().nullable(),
      seoDescription: z.string().nullable(),
      content: pageDocumentSchema,
      media,
    })
    .strict()
    .safeParse(value);
  return parsed.success ? parsed.data : null;
}

export const pageCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(200, pageMessages.titleInvalid),
    slug: z.string().trim(),
    templateKey: z.enum(["blank", "home"]),
    showInMenu: z.boolean(),
    parentId: z.string().uuid().nullable().optional(),
  })
  .strict()
  .refine((value) => value.templateKey === "home" || parsePageSlug(value.slug) !== null, { message: pageMessages.slugInvalid, path: ["slug"] });

export type PageCreateValues = z.infer<typeof pageCreateSchema>;

export function pageDetailPath(slug: string): string {
  return backendContract.pages.detail.path.replace(":slug", encodeURIComponent(slug));
}

export function pageAdminPath(id: string): string {
  return backendContract.pages.adminDetail.path.replace(":id", encodeURIComponent(id));
}

export function pageResourcePath(template: string, id: string): string {
  return template.replace(":id", encodeURIComponent(id));
}
