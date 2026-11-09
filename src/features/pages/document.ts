import { z } from "zod";
import { safeCmsUrl } from "@/lib/validation/url";
import { pageMessages } from "./messages";

const id = z.string().uuid();
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, pageMessages.colorInvalid);
const align = z.enum(["left", "center", "right"]);
const size = z.enum(["sm", "base", "lg", "xl", "2xl"]);
const weight = z.enum(["normal", "medium", "semibold", "bold"]);
const spacing = z.enum(["sm", "base", "lg"]);
const icons = z.enum(["school", "users", "book", "phone", "mail", "map-pin", "calendar", "award", "heart", "star", "check", "home", "clock", "graduation-cap"]);
const url = z.string().refine((value) => safeCmsUrl(value) !== null, pageMessages.urlInvalid);

const heading = z.object({ id, type: z.literal("heading"), text: z.string().trim().min(1).max(200), level: z.union([z.literal(2), z.literal(3), z.literal(4)]), align, color: hex, size, weight }).strict();
const text = z.object({ id, type: z.literal("text"), text: z.string().trim().min(1).max(5000), align, size, color: hex }).strict();
const image = z.object({ id, type: z.literal("image"), mediaId: id, alt: z.string().trim().min(1).max(200), size: z.enum(["sm", "base", "lg"]), align, caption: z.string().trim().max(300) }).strict();
const video = z.object({ id, type: z.literal("video"), mediaId: id, caption: z.string().trim().max(300) }).strict();
const button = z.object({ id, type: z.literal("button"), label: z.string().trim().min(1).max(80), url, size: z.enum(["sm", "base", "lg"]), align }).strict();
const divider = z.object({ id, type: z.literal("divider"), style: z.enum(["line", "space"]), spacing }).strict();
const iconList = z.object({ id, type: z.literal("icon-list"), items: z.array(z.object({ icon: icons, text: z.string().trim().min(1).max(200) }).strict()).min(1).max(20) }).strict();
const heroSlide = z.object({
  id,
  mediaId: id.nullable(),
  alt: z.string().trim().max(200),
  heading: z.string().trim().max(200),
  text: z.string().trim().max(500),
  enabled: z.boolean(),
}).strict();
const hero = z.object({
  id,
  type: z.literal("hero"),
  heading: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1).max(5000),
  align,
  mediaId: id.nullable().optional(),
  layout: z.enum(["center", "split", "banner"]).optional(),
  fit: z.enum(["cover", "contain"]).optional(),
  position: z.enum(["center", "top", "bottom"]).optional(),
  buttons: z.array(z.object({ label: z.string().trim().min(1).max(80), url }).strict()).max(2),
  slides: z.array(heroSlide).max(8).optional(),
  intervalSeconds: z.number().int().min(3).max(15).optional(),
  autoplay: z.boolean().optional(),
  transition: z.enum(["fade", "slide"]).optional(),
}).strict();
const stats = z.object({
  id,
  type: z.literal("stats"),
  items: z.array(z.object({ value: z.string().trim().min(1).max(20), label: z.string().trim().min(1).max(80) }).strict()).min(1).max(6),
}).strict();
const gallery = z.object({
  id,
  type: z.literal("gallery"),
  mediaIds: z.array(id).min(1).max(12),
}).strict();
const noticeList = z.object({
  id,
  type: z.literal("notice-list"),
  heading: z.string().trim().min(1).max(200),
  limit: z.number().int().min(1).max(6),
}).strict();
const contactInfo = z.object({
  id,
  type: z.literal("contact-info"),
  phone: z.string().trim().max(40),
  email: z.string().trim().max(200),
  address: z.string().trim().max(300),
}).strict();
const leaf = z.discriminatedUnion("type", [heading, text, image, video, button, divider, iconList]);
const card = z.object({
  id,
  type: z.literal("card"),
  mediaId: id.nullable(),
  heading: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000),
  linkLabel: z.string().trim().min(1).max(80).nullable(),
  linkUrl: url.nullable(),
  children: z.array(leaf).max(12),
}).strict();
const section = z.object({
  id,
  type: z.literal("section"),
  background: hex.nullable(),
  spacing,
  align,
  enabled: z.boolean().optional(),
  children: z.array(leaf).max(12),
}).strict();

export const pageBlockSchema = z.discriminatedUnion("type", [heading, text, image, video, button, divider, iconList, card, section, hero, stats, gallery, contactInfo, noticeList]);

export const pageDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  blocks: z.array(pageBlockSchema).max(40),
}).strict().superRefine((document, context) => {
  for (const block of document.blocks) {
    if (block.type === "card" && (block.linkLabel === null) !== (block.linkUrl === null)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: pageMessages.contentInvalid, path: ["blocks"] });
    }
  }
});

export type PageDocument = z.infer<typeof pageDocumentSchema>;
export type PageBlock = PageDocument["blocks"][number];

export const reservedSlugs = new Set(["admin", "login", "api", "media", "external-links", "notices", "health", "auth", "pages", "docs"]);

export function parsePageSlug(value: string): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 80 || reservedSlugs.has(value)) return null;
  return value;
}

export function clonePageBlock(block: PageBlock): PageBlock {
  const id = crypto.randomUUID();
  if (block.type === "section" || block.type === "card") {
    return { ...block, id, children: block.children.map((child) => ({ ...child, id: crypto.randomUUID() })) };
  }
  if (block.type === "hero") {
    return { ...block, id, slides: (block.slides ?? []).map((slide) => ({ ...slide, id: crypto.randomUUID() })) };
  }
  return { ...block, id };
}

export function emptyDocument(): PageDocument {
  return {
    schemaVersion: 1,
    blocks: [{ id: crypto.randomUUID(), type: "heading", text: "Page", level: 2, align: "left", color: "#111827", size: "2xl", weight: "semibold" }],
  };
}
