"use client";

import Link from "next/link";
import { Award, Book, Calendar, Check, Clock, GraduationCap, Heart, Home, Mail, MapPin, Phone, School, Star, Users, type LucideIcon } from "lucide-react";
import { CmsLink } from "@/components/safe/safe-link";
import { SafeImage } from "@/components/safe/safe-image";
import { previewBaseFromNoticeHref, resolveCmsHref, safeHttpsUrl } from "@/lib/validation/url";
import { HeroBanner } from "./hero-banner";
import { pageBlockSchema, type PageBlock, type PageDocument } from "../document";
import { useCopy } from "@/i18n/copy";
import type { PageMedia, RenderedNotice } from "../types";

const icons = {
  school: School,
  users: Users,
  book: Book,
  phone: Phone,
  mail: Mail,
  "map-pin": MapPin,
  calendar: Calendar,
  award: Award,
  heart: Heart,
  star: Star,
  check: Check,
  home: Home,
  clock: Clock,
  "graduation-cap": GraduationCap,
} as const satisfies Record<string, LucideIcon>;

const alignClass = { left: "text-left", center: "text-center", right: "text-right" } as const;
const sizeClass = { sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl" } as const;
const weightClass = { normal: "font-normal", medium: "font-medium", semibold: "font-semibold", bold: "font-bold" } as const;
const imageClass = { sm: "max-w-xs", base: "max-w-2xl", lg: "max-w-full" } as const;
const spacingClass = { sm: "py-2", base: "py-6", lg: "py-12" } as const;
const buttonClass = { sm: "px-2 py-1 text-sm", base: "px-3 py-2", lg: "px-4 py-3 text-lg" } as const;

export type { RenderedNotice };

export function BlockRenderer({
  content,
  media,
  notices = [],
  noticeHref = "/notices",
}: {
  content: PageDocument;
  media: PageMedia;
  notices?: RenderedNotice[];
  noticeHref?: string;
}) {
  const pageMessages = useCopy("pages");
  const blocks = content.blocks.flatMap((block) => {
    const parsed = pageBlockSchema.safeParse(block);
    return parsed.success ? [parsed.data] : [];
  });
  if (content.blocks.length > 0 && blocks.length === 0) return <p>{pageMessages.invalid}</p>;
  return (
    <div className="grid gap-6">
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} media={media} notices={notices} noticeHref={noticeHref} />
      ))}
    </div>
  );
}

function readableColor(color: string): string | undefined {
  const value = color.toLowerCase();
  if (value === "#111827" || value === "#000000" || value === "#ffffff") return undefined;
  return color;
}

function BlockView({ block, media, notices, noticeHref }: { block: PageBlock; media: PageMedia; notices: RenderedNotice[]; noticeHref: string }) {
  const pageMessages = useCopy("pages");
  const noticeMessages = useCopy("notices");
  if (block.type === "heading") {
    const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
    const color = readableColor(block.color);
    return <Tag className={`${alignClass[block.align]} ${sizeClass[block.size]} ${weightClass[block.weight]} text-foreground`} style={color ? { color } : undefined}>{block.text}</Tag>;
  }
  if (block.type === "text") {
    const color = readableColor(block.color);
    return <p className={`whitespace-pre-wrap text-foreground ${alignClass[block.align]} ${sizeClass[block.size]}`} style={color ? { color } : undefined}>{block.text}</p>;
  }
  if (block.type === "image") {
    const item = media[block.mediaId];
    if (!item || item.kind !== "IMAGE") return <p>{pageMessages.mediaEmpty}</p>;
    return (
      <figure className={alignClass[block.align]}>
        <SafeImage className={`${imageClass[block.size]} h-auto w-full rounded-md object-cover`} src={item.publicUrl} alt={block.alt} fallback={pageMessages.mediaEmpty} />
        {block.caption ? <figcaption className="mt-2 text-sm text-muted-foreground">{block.caption}</figcaption> : null}
      </figure>
    );
  }
  if (block.type === "video") return <VideoView mediaId={block.mediaId} caption={block.caption} media={media} />;
  if (block.type === "button") {
    const previewBase = previewBaseFromNoticeHref(noticeHref);
    return (
      <p className={alignClass[block.align]}>
        <CmsLink href={block.url} previewBase={previewBase}>
          <span className={`inline-flex rounded-md bg-primary text-primary-foreground ${buttonClass[block.size]}`}>{block.label}</span>
        </CmsLink>
      </p>
    );
  }
  if (block.type === "divider") {
    return block.style === "line" ? <hr className={`border-border ${spacingClass[block.spacing]}`} /> : <div className={spacingClass[block.spacing]} />;
  }
  if (block.type === "icon-list") {
    return (
      <ul className="grid gap-2">
        {block.items.map((item) => {
          const Icon = icons[item.icon];
          return (
            <li key={`${item.icon}-${item.text}`} className="flex items-center gap-2">
              <Icon aria-hidden className="size-4" />
              <span>{item.text}</span>
            </li>
          );
        })}
      </ul>
    );
  }
  if (block.type === "hero") {
    const previewBase = previewBaseFromNoticeHref(noticeHref);
    return <HeroBanner block={block} media={media} previewBase={previewBase} />;
  }
  if (block.type === "notice-list") {
    const visible = notices.slice(0, block.limit);
    return (
      <section className="grid gap-4 rounded-2xl border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold">{block.heading}</h2>
          <a className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={noticeHref}>{noticeMessages.title}</a>
        </div>
        {visible.length === 0 ? <p className="rounded-xl bg-muted px-4 py-6 text-muted-foreground">{noticeMessages.empty}</p> : null}
        <ul className="grid gap-3">
          {visible.map((notice) => (
            <li key={notice.id} className="rounded-xl border bg-background px-4 py-3">
              <p className="font-medium text-foreground">{notice.title}</p>
              {notice.date ? <p className="text-sm text-muted-foreground">{notice.date}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  if (block.type === "stats") {
    const items = block.items.filter((item) => {
      const value = item.value.trim();
      return value.length > 0 && value !== "-" && value !== "—";
    });
    if (items.length === 0) return null;
    return (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={`${item.value}-${item.label}`} className="rounded-xl border bg-card p-4 text-center">
            <p className="text-2xl font-semibold">{item.value}</p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "gallery") {
    return (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {block.mediaIds.map((mediaId) => {
          const item = media[mediaId];
          if (!item || item.kind !== "IMAGE") return <li key={mediaId} className="text-sm text-muted-foreground">{pageMessages.mediaEmpty}</li>;
          return (
            <li key={mediaId}>
              <SafeImage className="h-48 w-full rounded-md object-cover" src={item.publicUrl} alt={item.alt ?? block.type} fallback={pageMessages.mediaEmpty} />
            </li>
          );
        })}
      </ul>
    );
  }
  if (block.type === "contact-info") {
    if (!block.phone && !block.email && !block.address) return null;
    return (
      <address className="grid gap-2 rounded-xl border bg-card p-4 not-italic">
        {block.address ? <p>{block.address}</p> : null}
        {block.phone ? <p>{block.phone}</p> : null}
        {block.email ? <p>{block.email}</p> : null}
      </address>
    );
  }
  if (block.type === "card") {
    const previewBase = previewBaseFromNoticeHref(noticeHref);
    const image = block.mediaId ? media[block.mediaId] : null;
    return (
      <article className="grid gap-3 rounded-xl border p-4">
        {image?.kind === "IMAGE" ? <SafeImage className="h-40 w-full rounded-md object-cover" src={image.publicUrl} alt={block.heading} fallback={pageMessages.mediaEmpty} /> : null}
        <h3 className="text-xl font-semibold">{block.heading}</h3>
        {block.description ? <p className="whitespace-pre-wrap">{block.description}</p> : null}
        {block.linkLabel && block.linkUrl ? <CmsLink className="underline" href={block.linkUrl} previewBase={previewBase}>{block.linkLabel}</CmsLink> : null}
        {block.children.map((child) => (
          <BlockView key={child.id} block={child} media={media} notices={notices} noticeHref={noticeHref} />
        ))}
      </article>
    );
  }
  if (block.enabled === false || block.children.length === 0) return null;
  const title = block.children.find((child) => child.type === "heading");
  const target = title ? starterSectionHref[title.text] : undefined;
  return (
    <section className={`rounded-2xl border bg-card text-card-foreground shadow-sm ${spacingClass[block.spacing]} ${alignClass[block.align]}`} style={block.background ? { backgroundColor: block.background } : undefined}>
      <div className="grid gap-3 px-5 sm:px-6">
        {block.children.map((child) => (
          <BlockView key={child.id} block={child} media={media} notices={notices} noticeHref={noticeHref} />
        ))}
        {target ? <Link className="w-fit text-sm font-medium text-primary underline decoration-2 underline-offset-4" href={sectionHref(noticeHref, target)}>{pageMessages.readMore}</Link> : null}
      </div>
    </section>
  );
}

const starterSectionHref: Record<string, string> = {
  "About the institution": "/about",
  Admission: "/admission",
  Classes: "/academic",
  "Academic programs": "/academic",
  "Academic information": "/academic",
  "Academic overview": "/academic",
  Facilities: "/about",
  "News & Gallery": "/gallery",
  "News and Gallery": "/gallery",
  Gallery: "/gallery",
};

function sectionHref(noticeHref: string, path: string): string {
  const base = previewBaseFromNoticeHref(noticeHref);
  return resolveCmsHref(path, base);
}

function VideoView({ mediaId, caption, media }: { mediaId: string; caption: string; media: PageMedia }) {
  const pageMessages = useCopy("pages");
  const item = media[mediaId];
  const src = item ? safeHttpsUrl(item.publicUrl) : null;
  if (!item || item.kind !== "VIDEO" || !src) return <p>{pageMessages.mediaEmpty}</p>;
  const youtube = youtubeId(src);
  return (
    <figure>
      {youtube ? (
        <iframe
          className="aspect-video w-full rounded-md"
          src={`https://www.youtube-nocookie.com/embed/${youtube}`}
          title={caption || "Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      ) : (
        <video className="w-full rounded-md" controls src={src} />
      )}
      {caption ? <figcaption className="mt-2 text-sm text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}

function youtubeId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.protocol !== "https:") return null;
    const host = url.hostname;
    const id = host === "youtu.be" ? url.pathname.slice(1) : host === "youtube.com" || host === "www.youtube.com" || host === "www.youtube-nocookie.com" ? url.searchParams.get("v") ?? "" : "";
    return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
