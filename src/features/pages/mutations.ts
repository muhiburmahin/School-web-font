import { backendContract } from "@/config/backend-contract";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/api-client";
import type { PageDocument } from "./document";
import { formatDhaka } from "@/i18n/text";
import { pageResourcePath, parseManagedPage, parsePageSummaryList, type PageCreateValues } from "./schemas";
import type { ManagedPage, PageSummaryList, RenderedNotice } from "./types";

export async function fetchManagedPages(): Promise<PageSummaryList> {
  const data = await apiFetch<unknown>(backendContract.pages.adminList.path);
  const parsed = parsePageSummaryList(data);
  if (!parsed) throw new ApiError({ status: 0, kind: "client", messages: [] });
  return parsed;
}

export async function fetchManagedPage(id: string): Promise<ManagedPage> {
  const data = await apiFetch<unknown>(pageResourcePath(backendContract.pages.adminDetail.path, id));
  const parsed = parseManagedPage(data);
  if (!parsed) throw new ApiError({ status: 0, kind: "client", messages: [] });
  return parsed;
}

export function createPage(input: PageCreateValues): Promise<unknown> {
  return apiFetch(backendContract.pages.create.path, {
    method: "POST",
    body: {
      title: input.title,
      slug: input.templateKey === "home" ? undefined : input.slug || undefined,
      templateKey: input.templateKey,
      showInMenu: input.showInMenu,
      ...(input.parentId ? { parentId: input.parentId } : {}),
    },
  });
}

export function updatePage(
  id: string,
  input: { title: string; slug: string; showInMenu: boolean; seoTitle: string; seoDescription: string; content: PageDocument },
): Promise<unknown> {
  return apiFetch(pageResourcePath(backendContract.pages.update.path, id), { method: "PATCH", body: input });
}

export function setPageStatus(id: string, status: "DRAFT" | "PUBLISHED"): Promise<unknown> {
  return apiFetch(pageResourcePath(backendContract.pages.status.path, id), { method: "PATCH", body: { status } });
}

export function deletePage(id: string): Promise<unknown> {
  return apiFetch(pageResourcePath(backendContract.pages.remove.path, id), { method: "DELETE" });
}

export function movePage(id: string, parentId: string | null): Promise<unknown> {
  return apiFetch(pageResourcePath(backendContract.pages.update.path, id), { method: "PATCH", body: { parentId } });
}

export function reorderPages(items: { id: string; sortOrder: number }[]): Promise<unknown> {
  return apiFetch(backendContract.pages.reorder.path, { method: "PATCH", body: { items } });
}

export async function fetchPageMedia(): Promise<{ id: string; kind: "IMAGE" | "VIDEO"; publicUrl: string | null; originalFilename: string }[]> {
  const data = await apiFetch<unknown>(backendContract.media.list.path);
  if (!data || typeof data !== "object" || !("items" in data) || !Array.isArray(data.items)) {
    throw new ApiError({ status: 0, kind: "client", messages: [] });
  }
  return data.items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { id?: unknown; kind?: unknown; publicUrl?: unknown; originalFilename?: unknown };
    if (typeof row.id !== "string" || (row.kind !== "IMAGE" && row.kind !== "VIDEO")) return [];
    return [{ id: row.id, kind: row.kind, publicUrl: typeof row.publicUrl === "string" ? row.publicUrl : null, originalFilename: typeof row.originalFilename === "string" ? row.originalFilename : row.id }];
  });
}

export async function fetchPreviewNotices(locale: string): Promise<RenderedNotice[]> {
  const data = await apiFetch<unknown>(backendContract.notices.adminList.path);
  if (!data || typeof data !== "object" || !("items" in data) || !Array.isArray(data.items)) {
    return [];
  }
  return data.items
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { id?: unknown; title?: unknown; status?: unknown; noticeDate?: unknown };
      if (row.status !== "PUBLISHED") return [];
      const id = typeof row.id === "string" ? row.id : "";
      const title = typeof row.title === "string" ? row.title : "";
      if (!id || !title) return [];
      const noticeDate = typeof row.noticeDate === "string" ? row.noticeDate : "";
      return [{
        id,
        title,
        date: noticeDate ? formatDhaka(noticeDate, locale) : "",
      }];
    })
    .slice(0, 6);
}
