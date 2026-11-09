"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ApiError } from "@/lib/api-error";
import { BlockRenderer, type RenderedNotice } from "./block-renderer";
import { revalidatePages } from "../actions";
import { clonePageBlock, pageDocumentSchema, type PageBlock, type PageDocument } from "../document";
import { useCopy } from "@/i18n/copy";
import type { AppMessages } from "@/i18n/types";
import { MediaUpload } from "@/components/media/media-upload";
import { deletePage, fetchManagedPage, fetchPageMedia, fetchPreviewNotices, setPageStatus, updatePage } from "../mutations";
import type { PageMedia } from "../types";

const blockTypes = ["heading", "text", "image", "video", "button", "card", "section", "divider", "icon-list", "hero", "stats", "gallery", "contact-info", "notice-list"] as const;

export function PageEditor({ id }: { id: string }) {
  const pageMessages = useCopy("pages");
  const locale = useLocale();
  const router = useRouter();
  const client = useQueryClient();
  const page = useQuery({ queryKey: ["pages", "admin", id], queryFn: () => fetchManagedPage(id) });
  const media = useQuery({ queryKey: ["pages", "media"], queryFn: fetchPageMedia });
  const notices = useQuery({ queryKey: ["pages", "preview-notices", locale], queryFn: () => fetchPreviewNotices(locale) });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [source, setSource] = useState<typeof page.data>(undefined);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  if (page.data && page.data !== source) {
    setSource(page.data);
    setDraft(snapshot(page.data));
  }
  const saved = page.data ? JSON.stringify(snapshot(page.data)) : "";
  const dirty = draft !== null && JSON.stringify(draft) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) throw new ApiError({ status: 0, kind: "client", messages: [] });
      const content = pageDocumentSchema.safeParse(draft.content);
      if (!content.success) throw new ApiError({ status: 400, kind: "validation", messages: [] });
      await updatePage(id, { ...draft, seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, content: content.data });
    },
    onSuccess: async () => {
      const cache = await revalidatePages();
      toast.success(pageMessages.saved);
      if (!cache.ok) toast.error(pageMessages.unavailable);
      await client.invalidateQueries({ queryKey: ["pages", "admin", id] });
    },
    onError: (error) => toast.error(error instanceof ApiError && error.kind === "validation" ? pageMessages.contentInvalid : messageFor(error, pageMessages)),
  });

  const publish = useMutation({
    mutationFn: async (status: "DRAFT" | "PUBLISHED") => {
      if (draft && dirty) {
        const content = pageDocumentSchema.safeParse(draft.content);
        if (!content.success) throw new ApiError({ status: 400, kind: "validation", messages: [] });
        await updatePage(id, { ...draft, seoTitle: draft.seoTitle, seoDescription: draft.seoDescription, content: content.data });
      }
      await setPageStatus(id, status);
    },
    onSuccess: async (_data, status) => {
      const cache = await revalidatePages();
      toast.success(status === "PUBLISHED" ? pageMessages.published : pageMessages.unpublished);
      if (!cache.ok) toast.error(pageMessages.unavailable);
      await client.invalidateQueries({ queryKey: ["pages", "admin", id] });
    },
    onError: (error) => toast.error(messageFor(error, pageMessages)),
  });

  const remove = useMutation({
    mutationFn: () => deletePage(id),
    onSuccess: async () => {
      await revalidatePages();
      toast.success(pageMessages.removed);
      router.push("/admin/pages");
    },
    onError: (error) => toast.error(messageFor(error, pageMessages)),
  });

  if (page.isPending || !draft) return <Skeleton className="h-64 w-full" />;
  if (page.isError) {
    return (
      <Alert>
        <AlertDescription>{messageFor(page.error, pageMessages)}</AlertDescription>
        <Button type="button" onClick={() => void page.refetch()}>{pageMessages.unavailable}</Button>
      </Alert>
    );
  }

  const current = findBlock(draft.content.blocks, selected);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-3">
        {dirty ? <p>{pageMessages.unsaved}</p> : null}
        <label className="grid gap-1 text-sm">{pageMessages.pageTitle}<Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label className="grid gap-1 text-sm">{pageMessages.slug}<Input value={draft.slug} disabled={page.data.isSystem} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} /></label>
        {page.data.isSystem ? <p>{pageMessages.systemLocked}</p> : null}
        <label className="grid gap-1 text-sm">{pageMessages.seoTitle}<Input value={draft.seoTitle} onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })} /></label>
        <label className="grid gap-1 text-sm">{pageMessages.seoDescription}<textarea className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-foreground" value={draft.seoDescription} onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })} /></label>
        <label className="flex items-center gap-2 text-sm">{pageMessages.showInMenu}<Switch checked={draft.showInMenu} onCheckedChange={(checked) => setDraft({ ...draft, showInMenu: checked === true })} /></label>
        <div className="flex flex-wrap gap-2">
          {blockTypes.map((type) => (
            <Button key={type} type="button" variant="outline" size="sm" onClick={() => {
              const images = (media.data ?? []).filter((item) => item.kind === "IMAGE");
              const videos = (media.data ?? []).filter((item) => item.kind === "VIDEO");
              if ((type === "image" || type === "gallery") && images.length === 0) {
                toast.error(pageMessages.mediaEmpty);
                return;
              }
              if (type === "video" && videos.length === 0) {
                toast.error(pageMessages.mediaEmpty);
                return;
              }
              const imageId = images[0]?.id;
              const videoId = videos[0]?.id;
              setDraft({ ...draft, content: { ...draft.content, blocks: [...draft.content.blocks, defaultBlock(type, imageId, videoId)] } });
            }}>
              {pageMessages.addBlock} {type}
            </Button>
          ))}
        </div>
        <ol className="grid gap-2">
          {draft.content.blocks.map((block, index) => (
            <li key={block.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
              <span>{block.type}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => setSelected(block.id)}>{pageMessages.settings}</Button>
              <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => setDraft({ ...draft, content: move(draft.content, index, index - 1) })}>{pageMessages.moveUp}</Button>
              <Button type="button" size="sm" variant="outline" disabled={index === draft.content.blocks.length - 1} onClick={() => setDraft({ ...draft, content: move(draft.content, index, index + 1) })}>{pageMessages.moveDown}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setDraft({ ...draft, content: duplicate(draft.content, index) })}>{pageMessages.duplicate}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setPendingRemove(block.id)}>{pageMessages.remove}</Button>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? pageMessages.saving : pageMessages.save}</Button>
          <Button type="button" variant="outline" disabled={publish.isPending} onClick={() => publish.mutate(page.data.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED")}>
            {page.data.status === "PUBLISHED" ? pageMessages.unpublish : pageMessages.publish}
          </Button>
          <Button type="button" variant="outline" disabled={page.data.isSystem} onClick={() => setConfirmDelete(true)}>{pageMessages.remove}</Button>
        </div>
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">{pageMessages.preview}</h2>
        <BlockRenderer content={draft.content} media={previewMedia(page.data.media, media.data ?? [])} notices={notices.data ?? []} />
      </div>
      <Dialog open={current !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{pageMessages.settings}</DialogTitle></DialogHeader>
          {current ? (
            <BlockFields
              block={current}
              mediaItems={media.data ?? []}
              mediaEmpty={!media.isPending && (media.data?.length ?? 0) === 0}
              onChange={(next) => setDraft({ ...draft, content: replace(draft.content, next) })}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pageMessages.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{pageMessages.confirmDeleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{pageMessages.cancel}</AlertDialogCancel>
            <Button type="button" disabled={remove.isPending} onClick={() => remove.mutate()}>{pageMessages.remove}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={pendingRemove !== null} onOpenChange={(open) => { if (!open) setPendingRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pageMessages.confirmRemoveBlock}</AlertDialogTitle>
            <AlertDialogDescription>{pageMessages.confirmDeleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{pageMessages.cancel}</AlertDialogCancel>
            <Button type="button" onClick={() => {
              if (!pendingRemove) return;
              setDraft({ ...draft, content: { ...draft.content, blocks: draft.content.blocks.filter((item) => item.id !== pendingRemove) } });
              setPendingRemove(null);
              if (selected === pendingRemove) setSelected(null);
            }}>{pageMessages.remove}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface Draft {
  title: string;
  slug: string;
  showInMenu: boolean;
  seoTitle: string;
  seoDescription: string;
  content: PageDocument;
}

function snapshot(page: { title: string; slug: string; showInMenu: boolean; seoTitle: string | null; seoDescription: string | null; content: PageDocument }): Draft {
  return { title: page.title, slug: page.slug, showInMenu: page.showInMenu, seoTitle: page.seoTitle ?? "", seoDescription: page.seoDescription ?? "", content: page.content };
}

const textSizes = ["sm", "base", "lg", "xl", "2xl"] as const;
const imageSizes = ["sm", "base", "lg"] as const;
const iconNames = ["school", "users", "book", "phone", "mail", "map-pin", "calendar", "award", "heart", "star", "check", "home", "clock", "graduation-cap"] as const;

type LeafBlock = Extract<PageBlock, { type: "heading" | "text" | "image" | "video" | "button" | "divider" | "icon-list" }>;

function LeafFields({
  leaf,
  mediaItems,
  mediaEmpty,
  onChange,
}: {
  leaf: LeafBlock;
  mediaItems: { id: string; kind: "IMAGE" | "VIDEO"; originalFilename: string }[];
  mediaEmpty: boolean;
  onChange: (leaf: LeafBlock) => void;
}) {
  const pageMessages = useCopy("pages");
  if (leaf.type === "heading") {
    return (
      <div className="grid gap-2">
        <label className="grid gap-1 text-xs">
          {pageMessages.pageTitle}
          <Input
            aria-label={pageMessages.pageTitle}
            value={leaf.text}
            onChange={(event) => onChange({ ...leaf, text: event.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs">
            Level
            <Select
              value={String(leaf.level)}
              onValueChange={(val) => {
                const num = Number(val);
                if (num === 2 || num === 3 || num === 4) onChange({ ...leaf, level: num });
              }}
            >
              <SelectTrigger aria-label="Level"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
                <SelectItem value="4">H4</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1 text-xs">
            {pageMessages.fontSize}
            <Select
              value={leaf.size}
              onValueChange={(val) => {
                if (isTextSize(val)) onChange({ ...leaf, size: val });
              }}
            >
              <SelectTrigger aria-label={pageMessages.fontSize}><SelectValue /></SelectTrigger>
              <SelectContent>
                {textSizes.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs">
            {pageMessages.color}
            <Input
              aria-label={pageMessages.color}
              type="color"
              value={leaf.color}
              onChange={(event) => onChange({ ...leaf, color: event.target.value })}
            />
          </label>
          <AlignField value={leaf.align} onChange={(align) => onChange({ ...leaf, align })} />
        </div>
      </div>
    );
  }
  if (leaf.type === "text") {
    return (
      <div className="grid gap-2">
        <label className="grid gap-1 text-xs">
          {pageMessages.text}
          <textarea
            className="min-h-16 rounded-md border border-input bg-background px-3 py-2 text-foreground"
            value={leaf.text}
            onChange={(event) => onChange({ ...leaf, text: event.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs">
            {pageMessages.fontSize}
            <Select
              value={leaf.size}
              onValueChange={(val) => {
                if (isTextSize(val)) onChange({ ...leaf, size: val });
              }}
            >
              <SelectTrigger aria-label={pageMessages.fontSize}><SelectValue /></SelectTrigger>
              <SelectContent>
                {textSizes.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1 text-xs">
            {pageMessages.color}
            <Input
              aria-label={pageMessages.color}
              type="color"
              value={leaf.color}
              onChange={(event) => onChange({ ...leaf, color: event.target.value })}
            />
          </label>
        </div>
        <AlignField value={leaf.align} onChange={(align) => onChange({ ...leaf, align })} />
      </div>
    );
  }
  if (leaf.type === "image") {
    const images = mediaItems.filter((item) => item.kind === "IMAGE");
    return (
      <div className="grid gap-2">
        <p className="text-xs font-medium">{pageMessages.media}</p>
        <MediaUpload onUploaded={(asset) => { if (asset.kind === "IMAGE") onChange({ ...leaf, mediaId: asset.id }); }} />
        {mediaEmpty || images.length === 0 ? <p className="text-xs text-muted-foreground">{pageMessages.mediaEmpty}</p> : null}
        {images.length > 0 ? (
          <Select value={leaf.mediaId} onValueChange={(value) => { if (value) onChange({ ...leaf, mediaId: value }); }}>
            <SelectTrigger aria-label={pageMessages.media}><SelectValue placeholder={pageMessages.media} /></SelectTrigger>
            <SelectContent>
              {images.map((item) => <SelectItem key={item.id} value={item.id}>{item.originalFilename}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : null}
        <label className="grid gap-1 text-xs">
          {pageMessages.altText}
          <Input aria-label={pageMessages.altText} value={leaf.alt} onChange={(event) => onChange({ ...leaf, alt: event.target.value })} />
        </label>
        <label className="grid gap-1 text-xs">
          {pageMessages.caption}
          <Input aria-label={pageMessages.caption} value={leaf.caption} onChange={(event) => onChange({ ...leaf, caption: event.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs">
            {pageMessages.fontSize}
            <Select value={leaf.size} onValueChange={(value) => { if (isImageSize(value)) onChange({ ...leaf, size: value }); }}>
              <SelectTrigger aria-label={pageMessages.fontSize}><SelectValue /></SelectTrigger>
              <SelectContent>
                {imageSizes.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <AlignField value={leaf.align} onChange={(align) => onChange({ ...leaf, align })} />
        </div>
      </div>
    );
  }
  if (leaf.type === "button") {
    return (
      <div className="grid gap-2">
        <label className="grid gap-1 text-xs">
          {pageMessages.pageTitle}
          <Input aria-label={pageMessages.pageTitle} value={leaf.label} onChange={(event) => onChange({ ...leaf, label: event.target.value })} />
        </label>
        <label className="grid gap-1 text-xs">
          URL (HTTPS or /path)
          <Input aria-label={pageMessages.urlInvalid} placeholder="/about or https://..." value={leaf.url} onChange={(event) => onChange({ ...leaf, url: event.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs">
            {pageMessages.fontSize}
            <Select value={leaf.size} onValueChange={(val) => { if (val === "sm" || val === "base" || val === "lg") onChange({ ...leaf, size: val }); }}>
              <SelectTrigger aria-label={pageMessages.fontSize}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">sm</SelectItem>
                <SelectItem value="base">base</SelectItem>
                <SelectItem value="lg">lg</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <AlignField value={leaf.align} onChange={(align) => onChange({ ...leaf, align })} />
        </div>
      </div>
    );
  }
  if (leaf.type === "video") {
    const videos = mediaItems.filter((item) => item.kind === "VIDEO");
    return (
      <div className="grid gap-2">
        <p className="text-xs font-medium">{pageMessages.media}</p>
        {videos.length > 0 ? (
          <Select value={leaf.mediaId} onValueChange={(value) => { if (value) onChange({ ...leaf, mediaId: value }); }}>
            <SelectTrigger aria-label={pageMessages.media}><SelectValue placeholder={pageMessages.media} /></SelectTrigger>
            <SelectContent>
              {videos.map((item) => <SelectItem key={item.id} value={item.id}>{item.originalFilename}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : <p className="text-xs text-muted-foreground">{pageMessages.mediaEmpty}</p>}
        <label className="grid gap-1 text-xs">
          {pageMessages.caption}
          <Input aria-label={pageMessages.caption} value={leaf.caption} onChange={(event) => onChange({ ...leaf, caption: event.target.value })} />
        </label>
      </div>
    );
  }
  if (leaf.type === "divider") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-xs">
          Style
          <Select value={leaf.style} onValueChange={(val) => { if (val === "line" || val === "space") onChange({ ...leaf, style: val }); }}>
            <SelectTrigger aria-label="Style"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="space">Space</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-xs">
          {pageMessages.spacing}
          <Select value={leaf.spacing} onValueChange={(val) => { if (val === "sm" || val === "base" || val === "lg") onChange({ ...leaf, spacing: val }); }}>
            <SelectTrigger aria-label={pageMessages.spacing}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">sm</SelectItem>
              <SelectItem value="base">base</SelectItem>
              <SelectItem value="lg">lg</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
    );
  }
  if (leaf.type === "icon-list") {
    return (
      <div className="grid gap-2">
        {leaf.items.map((item, index) => (
          <div key={`${item.icon}-${index}`} className="flex flex-wrap items-center gap-2">
            <Select
              value={item.icon}
              onValueChange={(val) => {
                if (val && isIconName(val)) {
                  onChange({ ...leaf, items: leaf.items.map((r, ri) => (ri === index ? { ...r, icon: val } : r)) });
                }
              }}
            >
              <SelectTrigger className="w-36" aria-label="Icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconNames.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1 min-w-40"
              value={item.text}
              onChange={(event) =>
                onChange({
                  ...leaf,
                  items: leaf.items.map((r, ri) => (ri === index ? { ...r, text: event.target.value } : r)),
                })
              }
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={leaf.items.length <= 1}
              onClick={() => onChange({ ...leaf, items: leaf.items.filter((_, ri) => ri !== index) })}
            >
              {pageMessages.remove}
            </Button>
          </div>
        ))}
        {leaf.items.length < 20 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...leaf, items: [...leaf.items, { icon: "check", text: "New item" }] })}
          >
            + Item
          </Button>
        ) : null}
      </div>
    );
  }
  return null;
}

function BlockFields({ block, mediaItems, mediaEmpty, onChange }: { block: PageBlock; mediaItems: { id: string; kind: "IMAGE" | "VIDEO"; originalFilename: string }[]; mediaEmpty: boolean; onChange: (block: PageBlock) => void }) {
  const pageMessages = useCopy("pages");
  if (block.type === "heading" || block.type === "text") {
    return (
      <div className="grid gap-2">
        <label className="grid gap-1 text-sm">
          {block.type === "heading" ? pageMessages.pageTitle : pageMessages.text}
          <textarea className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-foreground" value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          {pageMessages.color}
          <Input aria-label={pageMessages.color} type="color" value={block.color} onChange={(event) => onChange({ ...block, color: event.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          {pageMessages.fontSize}
          <Select value={block.size} onValueChange={(value) => { if (isTextSize(value)) onChange({ ...block, size: value }); }}>
            <SelectTrigger className="w-full" aria-label={pageMessages.fontSize}><SelectValue /></SelectTrigger>
            <SelectContent>
              {textSizes.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}
            </SelectContent>
          </Select>
        </label>
        <AlignField value={block.align} onChange={(align) => onChange({ ...block, align })} />
      </div>
    );
  }
  if (block.type === "image" || block.type === "video") {
    const kind = block.type === "image" ? "IMAGE" : "VIDEO";
    const choices = mediaItems.filter((item) => item.kind === kind);
    return (
      <div className="grid gap-2">
        {block.type === "image" ? (
          <MediaUpload onUploaded={(asset) => { if (asset.kind === "IMAGE") onChange({ ...block, mediaId: asset.id }); }} />
        ) : null}
        {mediaEmpty || choices.length === 0 ? <p>{pageMessages.mediaEmpty}</p> : null}
        <Select value={block.mediaId} onValueChange={(value) => { if (value) onChange({ ...block, mediaId: value }); }}>
          <SelectTrigger aria-label={pageMessages.media}><SelectValue placeholder={pageMessages.media} /></SelectTrigger>
          <SelectContent>
            {choices.map((item) => <SelectItem key={item.id} value={item.id}>{item.originalFilename}</SelectItem>)}
          </SelectContent>
        </Select>
        {block.type === "image" ? (
          <>
            <label className="grid gap-1 text-sm">
              {pageMessages.altText}
              <Input aria-label={pageMessages.altText} value={block.alt} onChange={(event) => onChange({ ...block, alt: event.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              {pageMessages.caption}
              <Input aria-label={pageMessages.caption} value={block.caption} onChange={(event) => onChange({ ...block, caption: event.target.value })} />
            </label>
            <label className="grid gap-1 text-sm">
              {pageMessages.fontSize}
              <Select value={block.size} onValueChange={(value) => { if (isImageSize(value)) onChange({ ...block, size: value }); }}>
                <SelectTrigger className="w-full" aria-label={pageMessages.fontSize}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {imageSizes.map((size) => <SelectItem key={size} value={size}>{size}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <AlignField value={block.align} onChange={(align) => onChange({ ...block, align })} />
          </>
        ) : (
          <label className="grid gap-1 text-sm">
            {pageMessages.caption}
            <Input aria-label={pageMessages.caption} value={block.caption} onChange={(event) => onChange({ ...block, caption: event.target.value })} />
          </label>
        )}
      </div>
    );
  }
  if (block.type === "button") {
    return (
      <div className="grid gap-2">
        <Input aria-label={pageMessages.pageTitle} value={block.label} onChange={(event) => onChange({ ...block, label: event.target.value })} />
        <Input aria-label={pageMessages.urlInvalid} placeholder="/about or https://..." value={block.url} onChange={(event) => onChange({ ...block, url: event.target.value })} />
        <AlignField value={block.align} onChange={(align) => onChange({ ...block, align })} />
      </div>
    );
  }
  if (block.type === "hero") {
    const images = mediaItems.filter((item) => item.kind === "IMAGE");
    return (
      <div className="grid gap-2">
        <Input aria-label={pageMessages.pageTitle} value={block.heading} onChange={(event) => onChange({ ...block, heading: event.target.value })} />
        <textarea className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-foreground" value={block.text} onChange={(event) => onChange({ ...block, text: event.target.value })} />
        <AlignField value={block.align} onChange={(align) => onChange({ ...block, align })} />
        <p className="text-sm text-muted-foreground">{pageMessages.heroGuidance}</p>
        <Select value={block.layout ?? "center"} onValueChange={(value) => { if (value === "center" || value === "split" || value === "banner") onChange({ ...block, layout: value }); }}>
          <SelectTrigger aria-label={pageMessages.heroLayout}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="center">{pageMessages.heroCenter}</SelectItem>
            <SelectItem value="split">{pageMessages.heroSplit}</SelectItem>
            <SelectItem value="banner">{pageMessages.heroBanner}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={block.fit ?? "cover"} onValueChange={(value) => { if (value === "cover" || value === "contain") onChange({ ...block, fit: value }); }}>
          <SelectTrigger aria-label={pageMessages.heroFit}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">{pageMessages.heroCover}</SelectItem>
            <SelectItem value="contain">{pageMessages.heroContain}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={block.position ?? "center"} onValueChange={(value) => { if (value === "center" || value === "top" || value === "bottom") onChange({ ...block, position: value }); }}>
          <SelectTrigger aria-label={pageMessages.heroPosition}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="center">{pageMessages.heroCenter}</SelectItem>
            <SelectItem value="top">{pageMessages.heroTop}</SelectItem>
            <SelectItem value="bottom">{pageMessages.heroBottom}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm">{pageMessages.heroImage}</p>
        <MediaUpload onUploaded={(asset) => { if (asset.kind === "IMAGE") onChange({ ...block, mediaId: asset.id }); }} />
        {images.length === 0 ? <p>{pageMessages.mediaEmpty}</p> : (
          <Select value={block.mediaId ?? undefined} onValueChange={(value) => { if (value) onChange({ ...block, mediaId: value }); }}>
            <SelectTrigger aria-label={pageMessages.heroImage}><SelectValue placeholder={pageMessages.media} /></SelectTrigger>
            <SelectContent>
              {images.map((item) => <SelectItem key={item.id} value={item.id}>{item.originalFilename}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {block.mediaId ? <Button type="button" variant="outline" onClick={() => onChange({ ...block, mediaId: null })}>{pageMessages.removeImage}</Button> : null}
        <label className="grid gap-1 text-sm">
          {pageMessages.slideInterval}
          <Input
            aria-label={pageMessages.slideInterval}
            type="number"
            min={3}
            max={15}
            value={block.intervalSeconds ?? 5}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isInteger(value) && value >= 3 && value <= 15) onChange({ ...block, intervalSeconds: value });
            }}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          {pageMessages.slideAutoplay}
          <Switch checked={block.autoplay !== false} onCheckedChange={(checked) => onChange({ ...block, autoplay: checked === true })} />
        </label>
        <label className="grid gap-1 text-sm">
          {pageMessages.slideTransition}
          <Select value={block.transition ?? "fade"} onValueChange={(value) => { if (value === "fade" || value === "slide") onChange({ ...block, transition: value }); }}>
            <SelectTrigger aria-label={pageMessages.slideTransition}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fade">{pageMessages.slideFade}</SelectItem>
              <SelectItem value="slide">{pageMessages.slideMove}</SelectItem>
            </SelectContent>
          </Select>
        </label>
        {(block.slides ?? []).map((slide, index, slides) => (
          <div key={slide.id} className="grid gap-2 rounded-md border p-3">
            <label className="flex items-center gap-2 text-sm">
              {pageMessages.showSlide}
              <Switch checked={slide.enabled} onCheckedChange={(checked) => onChange({ ...block, slides: slides.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: checked === true } : item) })} />
            </label>
            <Input aria-label={pageMessages.slideTitle} value={slide.heading} placeholder={pageMessages.slideTitle} onChange={(event) => onChange({ ...block, slides: slides.map((item, itemIndex) => itemIndex === index ? { ...item, heading: event.target.value } : item) })} />
            <textarea aria-label={pageMessages.slideText} className="min-h-16 rounded-md border border-input bg-background px-3 py-2 text-foreground" value={slide.text} placeholder={pageMessages.slideText} onChange={(event) => onChange({ ...block, slides: slides.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item) })} />
            <Input aria-label={pageMessages.altText} value={slide.alt} placeholder={pageMessages.altText} onChange={(event) => onChange({ ...block, slides: slides.map((item, itemIndex) => itemIndex === index ? { ...item, alt: event.target.value } : item) })} />
            <MediaUpload onUploaded={(asset) => { if (asset.kind === "IMAGE") onChange({ ...block, slides: slides.map((item, itemIndex) => itemIndex === index ? { ...item, mediaId: asset.id } : item) }); }} />
            {images.length > 0 ? (
              <Select value={slide.mediaId ?? undefined} onValueChange={(value) => { if (value) onChange({ ...block, slides: slides.map((item, itemIndex) => itemIndex === index ? { ...item, mediaId: value } : item) }); }}>
                <SelectTrigger aria-label={pageMessages.heroImage}><SelectValue placeholder={pageMessages.media} /></SelectTrigger>
                <SelectContent>
                  {images.map((item) => <SelectItem key={item.id} value={item.id}>{item.originalFilename}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => onChange({ ...block, slides: moveSlide(slides, index, index - 1) })}>{pageMessages.moveUp}</Button>
              <Button type="button" size="sm" variant="outline" disabled={index === slides.length - 1} onClick={() => onChange({ ...block, slides: moveSlide(slides, index, index + 1) })}>{pageMessages.moveDown}</Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={(block.slides ?? []).length >= 8}
                onClick={() => {
                  const cloned = { ...slide, id: crypto.randomUUID() };
                  const nextSlides = [...slides];
                  nextSlides.splice(index + 1, 0, cloned);
                  onChange({ ...block, slides: nextSlides });
                }}
              >
                {pageMessages.duplicate}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...block, slides: slides.filter((item) => item.id !== slide.id) })}>{pageMessages.removeSlide}</Button>
            </div>
          </div>
        ))}
        {(block.slides ?? []).length < 8 ? (
          <Button type="button" variant="outline" onClick={() => onChange({ ...block, slides: [...(block.slides ?? []), { id: crypto.randomUUID(), mediaId: null, alt: "", heading: "", text: "", enabled: true }] })}>{pageMessages.addSlide}</Button>
        ) : null}
        {block.buttons.map((button, index) => (
          <div key={`${button.label}-${index}`} className="grid gap-2">
            <Input aria-label={pageMessages.pageTitle} value={button.label} onChange={(event) => onChange({ ...block, buttons: block.buttons.map((row, rowIndex) => rowIndex === index ? { ...row, label: event.target.value } : row) })} />
            <Input aria-label={pageMessages.urlInvalid} placeholder="/about or https://..." value={button.url} onChange={(event) => onChange({ ...block, buttons: block.buttons.map((row, rowIndex) => rowIndex === index ? { ...row, url: event.target.value } : row) })} />
            <Button type="button" variant="outline" onClick={() => onChange({ ...block, buttons: block.buttons.filter((_, rowIndex) => rowIndex !== index) })}>{pageMessages.removeLink}</Button>
          </div>
        ))}
        {block.buttons.length < 2 ? <Button type="button" variant="outline" onClick={() => onChange({ ...block, buttons: [...block.buttons, { label: "Open", url: "https://example.com" }] })}>{pageMessages.addLink}</Button> : null}
      </div>
    );
  }
  if (block.type === "stats") {
    return (
      <div className="grid gap-2">
        {block.items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="grid gap-2 sm:grid-cols-2">
            <Input aria-label={pageMessages.value} value={item.value} onChange={(event) => onChange({ ...block, items: block.items.map((row, rowIndex) => rowIndex === index ? { ...row, value: event.target.value } : row) })} />
            <Input aria-label={pageMessages.text} value={item.label} onChange={(event) => onChange({ ...block, items: block.items.map((row, rowIndex) => rowIndex === index ? { ...row, label: event.target.value } : row) })} />
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "contact-info") {
    return (
      <div className="grid gap-2">
        <label className="grid gap-1 text-sm">
          {pageMessages.phone}
          <Input aria-label={pageMessages.phone} value={block.phone} onChange={(event) => onChange({ ...block, phone: event.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          {pageMessages.email}
          <Input aria-label={pageMessages.email} value={block.email} onChange={(event) => onChange({ ...block, email: event.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          {pageMessages.address}
          <Input aria-label={pageMessages.address} value={block.address} onChange={(event) => onChange({ ...block, address: event.target.value })} />
        </label>
      </div>
    );
  }
  if (block.type === "card") {
    const images = mediaItems.filter((item) => item.kind === "IMAGE");
    return (
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm">
          {pageMessages.pageTitle}
          <Input aria-label={pageMessages.pageTitle} value={block.heading} onChange={(event) => onChange({ ...block, heading: event.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          {pageMessages.text}
          <textarea className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-foreground" value={block.description} onChange={(event) => onChange({ ...block, description: event.target.value })} />
        </label>
        <p className="text-sm font-medium">{pageMessages.media}</p>
        <MediaUpload onUploaded={(asset) => { if (asset.kind === "IMAGE") onChange({ ...block, mediaId: asset.id }); }} />
        {images.length > 0 ? (
          <Select value={block.mediaId ?? undefined} onValueChange={(value) => { if (value) onChange({ ...block, mediaId: value }); }}>
            <SelectTrigger aria-label={pageMessages.media}><SelectValue placeholder={pageMessages.media} /></SelectTrigger>
            <SelectContent>
              {images.map((item) => <SelectItem key={item.id} value={item.id}>{item.originalFilename}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : null}
        {block.mediaId ? <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...block, mediaId: null })}>{pageMessages.removeImage}</Button> : null}
        <label className="grid gap-1 text-sm">
          Link label
          <Input
            value={block.linkLabel ?? ""}
            onChange={(event) => {
              const label = event.target.value.trim();
              if (label) {
                onChange({ ...block, linkLabel: label, linkUrl: block.linkUrl || "https://example.com" });
              } else {
                onChange({ ...block, linkLabel: null, linkUrl: null });
              }
            }}
          />
        </label>
        {block.linkLabel ? (
          <label className="grid gap-1 text-sm">
            Link URL (HTTPS or /path)
            <Input
              placeholder="/about or https://..."
              value={block.linkUrl ?? ""}
              onChange={(event) => onChange({ ...block, linkUrl: event.target.value })}
            />
          </label>
        ) : null}
        <div className="mt-2 grid gap-2">
          {block.children.map((child, index) => (
            <div key={child.id} className="grid gap-2 rounded-md border p-2 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase">{child.type}</span>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => onChange({ ...block, children: moveSlide(block.children, index, index - 1) })}>{pageMessages.moveUp}</Button>
                  <Button type="button" size="sm" variant="outline" disabled={index === block.children.length - 1} onClick={() => onChange({ ...block, children: moveSlide(block.children, index, index + 1) })}>{pageMessages.moveDown}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...block, children: block.children.filter((c) => c.id !== child.id) })}>{pageMessages.remove}</Button>
                </div>
              </div>
              <LeafFields
                leaf={child}
                mediaItems={mediaItems}
                mediaEmpty={mediaEmpty}
                onChange={(nextChild) => onChange({ ...block, children: block.children.map((c) => (c.id === nextChild.id ? nextChild : c)) })}
              />
            </div>
          ))}
          {block.children.length < 12 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...block, children: [...block.children, defaultLeaf("text")] })}>{pageMessages.addBlock}</Button>
          ) : null}
        </div>
      </div>
    );
  }
  if (block.type === "section") {
    return (
      <div className="grid gap-3">
        <label className="flex items-center gap-2 text-sm">
          {pageMessages.showSection}
          <Switch checked={block.enabled !== false} onCheckedChange={(checked) => onChange({ ...block, enabled: checked === true })} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-sm">
            {pageMessages.background}
            <Input aria-label={pageMessages.background} type="color" value={block.background ?? "#ffffff"} onChange={(event) => onChange({ ...block, background: event.target.value })} />
          </label>
          <div className="flex items-end">
            <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...block, background: null })}>{pageMessages.cancel}</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AlignField value={block.align} onChange={(align) => onChange({ ...block, align })} />
          <label className="grid gap-1 text-sm">
            {pageMessages.spacing}
            <Select value={block.spacing} onValueChange={(value) => { if (value === "sm" || value === "base" || value === "lg") onChange({ ...block, spacing: value }); }}>
              <SelectTrigger className="w-full" aria-label={pageMessages.spacing}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">sm</SelectItem>
                <SelectItem value="base">base</SelectItem>
                <SelectItem value="lg">lg</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="mt-2 grid gap-2">
          <p className="text-sm font-semibold">{pageMessages.settings}</p>
          {block.children.map((child, index) => (
            <div key={child.id} className="grid gap-2 rounded-md border p-3 bg-muted/20">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{child.type}</span>
                <div className="flex flex-wrap gap-1">
                  <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => onChange({ ...block, children: moveSlide(block.children, index, index - 1) })}>{pageMessages.moveUp}</Button>
                  <Button type="button" size="sm" variant="outline" disabled={index === block.children.length - 1} onClick={() => onChange({ ...block, children: moveSlide(block.children, index, index + 1) })}>{pageMessages.moveDown}</Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={block.children.length >= 12}
                    onClick={() => {
                      const clonedChild = { ...child, id: crypto.randomUUID() };
                      const nextChildren = [...block.children];
                      nextChildren.splice(index + 1, 0, clonedChild);
                      onChange({ ...block, children: nextChildren });
                    }}
                  >
                    {pageMessages.duplicate}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...block, children: block.children.filter((c) => c.id !== child.id) })}>{pageMessages.remove}</Button>
                </div>
              </div>
              <LeafFields
                leaf={child}
                mediaItems={mediaItems}
                mediaEmpty={mediaEmpty}
                onChange={(nextChild) => onChange({ ...block, children: block.children.map((c) => (c.id === nextChild.id ? nextChild : c)) })}
              />
            </div>
          ))}
          {block.children.length < 12 ? (
            <div className="flex flex-wrap gap-2">
              {(["heading", "text", "image", "button", "icon-list"] as const).map((leafType) => (
                <Button
                  key={leafType}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const images = mediaItems.filter((item) => item.kind === "IMAGE");
                    if (leafType === "image" && images.length === 0) {
                      toast.error(pageMessages.mediaEmpty);
                      return;
                    }
                    const newChild = defaultLeaf(leafType, images[0]?.id);
                    onChange({ ...block, children: [...block.children, newChild] });
                  }}
                >
                  + {leafType}
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
  if (block.type === "notice-list") {
    return (
      <div className="grid gap-2">
        <label className="grid gap-1 text-sm">
          {pageMessages.pageTitle}
          <Input aria-label={pageMessages.pageTitle} value={block.heading} onChange={(event) => onChange({ ...block, heading: event.target.value })} />
        </label>
        <label className="grid gap-1 text-sm">
          Limit (1-6)
          <Input
            type="number"
            min={1}
            max={6}
            value={block.limit}
            onChange={(event) => {
              const val = Number(event.target.value);
              if (Number.isInteger(val) && val >= 1 && val <= 6) onChange({ ...block, limit: val });
            }}
          />
        </label>
      </div>
    );
  }
  if (block.type === "gallery") {
    const images = mediaItems.filter((item) => item.kind === "IMAGE");
    return (
      <div className="grid gap-2">
        <p className="text-sm font-semibold">{pageMessages.media}</p>
        <MediaUpload onUploaded={(asset) => { if (asset.kind === "IMAGE" && block.mediaIds.length < 12 && typeof asset.id === "string") onChange({ ...block, mediaIds: [...block.mediaIds, asset.id] }); }} />
        {images.length > 0 && block.mediaIds.length < 12 ? (
          <Select onValueChange={(val) => { if (typeof val === "string" && val && !block.mediaIds.includes(val)) onChange({ ...block, mediaIds: [...block.mediaIds, val] }); }}>
            <SelectTrigger aria-label={pageMessages.media}><SelectValue placeholder={pageMessages.addBlock} /></SelectTrigger>
            <SelectContent>
              {images.filter((img) => !block.mediaIds.includes(img.id)).map((item) => <SelectItem key={item.id} value={item.id}>{item.originalFilename}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : null}
        <div className="grid gap-2">
          {block.mediaIds.map((mediaId, index) => {
            const item = mediaItems.find((m) => m.id === mediaId);
            return (
              <div key={mediaId} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <span className="truncate">{item?.originalFilename ?? mediaId}</span>
                <div className="flex gap-1">
                  <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => onChange({ ...block, mediaIds: moveSlide(block.mediaIds, index, index - 1) })}>{pageMessages.moveUp}</Button>
                  <Button type="button" size="sm" variant="outline" disabled={index === block.mediaIds.length - 1} onClick={() => onChange({ ...block, mediaIds: moveSlide(block.mediaIds, index, index + 1) })}>{pageMessages.moveDown}</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...block, mediaIds: block.mediaIds.filter((id) => id !== mediaId) })}>{pageMessages.remove}</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  if (block.type === "divider") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-sm">
          Style
          <Select value={block.style} onValueChange={(val) => { if (val === "line" || val === "space") onChange({ ...block, style: val }); }}>
            <SelectTrigger aria-label="Style"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="space">Space</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="grid gap-1 text-sm">
          {pageMessages.spacing}
          <Select value={block.spacing} onValueChange={(val) => { if (val === "sm" || val === "base" || val === "lg") onChange({ ...block, spacing: val }); }}>
            <SelectTrigger aria-label={pageMessages.spacing}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">sm</SelectItem>
              <SelectItem value="base">base</SelectItem>
              <SelectItem value="lg">lg</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
    );
  }
  if (block.type === "icon-list") {
    return (
      <div className="grid gap-2">
        {block.items.map((item, index) => (
          <div key={`${item.icon}-${index}`} className="flex flex-wrap items-center gap-2">
            <Select
              value={item.icon}
              onValueChange={(val) => {
                if (val && isIconName(val)) {
                  onChange({ ...block, items: block.items.map((r, ri) => (ri === index ? { ...r, icon: val } : r)) });
                }
              }}
            >
              <SelectTrigger className="w-36" aria-label="Icon">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconNames.map((icon) => (
                  <SelectItem key={icon} value={icon}>
                    {icon}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1 min-w-40"
              value={item.text}
              onChange={(event) =>
                onChange({
                  ...block,
                  items: block.items.map((r, ri) => (ri === index ? { ...r, text: event.target.value } : r)),
                })
              }
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={block.items.length <= 1}
              onClick={() => onChange({ ...block, items: block.items.filter((_, ri) => ri !== index) })}
            >
              {pageMessages.remove}
            </Button>
          </div>
        ))}
        {block.items.length < 20 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onChange({ ...block, items: [...block.items, { icon: "check", text: "New item" }] })}
          >
            + Item
          </Button>
        ) : null}
      </div>
    );
  }
  return null;
}

function AlignField({ value, onChange }: { value: "left" | "center" | "right"; onChange: (value: "left" | "center" | "right") => void }) {
  const pageMessages = useCopy("pages");
  return (
    <label className="grid gap-1 text-sm">
      {pageMessages.align}
      <Select value={value} onValueChange={(next) => { if (next === "left" || next === "center" || next === "right") onChange(next); }}>
        <SelectTrigger className="w-full" aria-label={pageMessages.align}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="left">{pageMessages.alignLeft}</SelectItem>
          <SelectItem value="center">{pageMessages.alignCenter}</SelectItem>
          <SelectItem value="right">{pageMessages.alignRight}</SelectItem>
        </SelectContent>
      </Select>
    </label>
  );
}

function isIconName(value: string | null): value is (typeof iconNames)[number] {
  return iconNames.some((icon) => icon === value);
}

function isTextSize(value: string | null): value is (typeof textSizes)[number] {
  return textSizes.some((size) => size === value);
}

function isImageSize(value: string | null): value is (typeof imageSizes)[number] {
  return imageSizes.some((size) => size === value);
}

function previewMedia(saved: PageMedia, items: { id: string; kind: "IMAGE" | "VIDEO"; publicUrl: string | null }[]): PageMedia {
  const next = { ...saved };
  for (const item of items) {
    if (!item.publicUrl || next[item.id]) continue;
    next[item.id] = { kind: item.kind, publicUrl: item.publicUrl, alt: null };
  }
  return next;
}

function defaultBlock(type: (typeof blockTypes)[number], imageId?: string, videoId?: string): PageBlock {
  const id = crypto.randomUUID();
  if (type === "hero") return { id, type, heading: "Heading", text: "Text", align: "left", mediaId: null, layout: "banner", fit: "cover", position: "center", buttons: [], slides: [], intervalSeconds: 5, autoplay: true, transition: "fade" };
  if (type === "stats") return { id, type, items: [{ value: "1", label: "Item" }] };
  if (type === "gallery") return { id, type, mediaIds: [imageId ?? crypto.randomUUID()] };
  if (type === "contact-info") return { id, type, phone: "", email: "", address: "" };
  if (type === "notice-list") return { id, type, heading: "Notices", limit: 4 };
  if (type === "card" || type === "section") return type === "card"
    ? { id: crypto.randomUUID(), type, mediaId: imageId ?? null, heading: "Card", description: "", linkLabel: null, linkUrl: null, children: [] }
    : { id: crypto.randomUUID(), type, background: null, spacing: "base", align: "left", children: [] };
  return defaultLeaf(type, imageId, videoId);
}

function defaultLeaf(type: "heading" | "text" | "image" | "video" | "button" | "divider" | "icon-list", imageId?: string, videoId?: string): Extract<PageBlock, { type: "heading" | "text" | "image" | "video" | "button" | "divider" | "icon-list" }> {
  const id = crypto.randomUUID();
  if (type === "heading") return { id, type, text: "Heading", level: 2, align: "left", color: "#111827", size: "xl", weight: "semibold" };
  if (type === "text") return { id, type, text: "Text", align: "left", size: "base", color: "#111827" };
  if (type === "image") return { id, type, mediaId: imageId ?? crypto.randomUUID(), alt: "Image", size: "base", align: "left", caption: "" };
  if (type === "video") return { id, type, mediaId: videoId ?? crypto.randomUUID(), caption: "" };
  if (type === "button") return { id, type, label: "Open", url: "https://example.com", size: "base", align: "left" };
  if (type === "divider") return { id, type, style: "line", spacing: "base" };
  return { id, type: "icon-list", items: [{ icon: "check", text: "Item" }] };
}

function moveSlide<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (!item) return items;
  next.splice(to, 0, item);
  return next;
}

function move(content: PageDocument, from: number, to: number): PageDocument {
  const blocks = [...content.blocks];
  const [item] = blocks.splice(from, 1);
  if (!item) return content;
  blocks.splice(to, 0, item);
  return { ...content, blocks };
}

function duplicate(content: PageDocument, index: number): PageDocument {
  const block = content.blocks[index];
  if (!block) return content;
  const blocks = [...content.blocks];
  blocks.splice(index + 1, 0, clonePageBlock(block));
  return { ...content, blocks };
}

function replace(content: PageDocument, next: PageBlock): PageDocument {
  return { ...content, blocks: content.blocks.map((block) => (block.id === next.id ? next : block)) };
}

function findBlock(blocks: PageBlock[], id: string | null): PageBlock | null {
  if (!id) return null;
  return blocks.find((block) => block.id === id) ?? null;
}

function messageFor(error: unknown, messages: AppMessages["pages"]): string {
  if (error instanceof ApiError && error.kind === "forbidden") return messages.forbiddenWrite;
  if (error instanceof ApiError && error.kind === "not_found") return messages.notFound;
  return messages.unavailable;
}
