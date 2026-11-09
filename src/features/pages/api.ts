import { fetchAuthed } from "@/lib/data/authed";
import { fetchPublic } from "@/lib/data/public";
import type { FetchResult } from "@/lib/data/result";
import { backendContract } from "@/config/backend-contract";
import { pageAdminPath, pageDetailPath, parseManagedPage, parsePageMenu, parsePageSummaryList, parsePublicPage } from "./schemas";
import type { ManagedPage, PageMenu, PageSummaryList, PublicPage } from "./types";

function read<T>(result: FetchResult<unknown>, parse: (value: unknown) => T | null): FetchResult<T> {
  if (result.status !== "success") return result;
  const data = parse(result.data);
  if (!data) return { status: "invalid-response" };
  return { status: "success", data };
}

export async function getPageMenu(): Promise<FetchResult<PageMenu>> {
  return read(await fetchPublic(backendContract.pages.menu.path, 60, "pages"), parsePageMenu);
}

export async function getPublicPage(slug: string): Promise<FetchResult<PublicPage>> {
  return read(await fetchPublic(pageDetailPath(slug), 60, "pages"), parsePublicPage);
}

export async function getAdminPages(): Promise<FetchResult<PageSummaryList>> {
  return read(await fetchAuthed(backendContract.pages.adminList.path), parsePageSummaryList);
}

export async function getAdminPage(id: string): Promise<FetchResult<ManagedPage>> {
  return read(await fetchAuthed(pageAdminPath(id)), parseManagedPage);
}
