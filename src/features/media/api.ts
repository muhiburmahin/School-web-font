import { fetchAuthed } from "@/lib/data/authed";
import { fetchPublic } from "@/lib/data/public";
import type { FetchResult } from "@/lib/data/result";
import type { ListQuery } from "@/lib/validation/query";
import { mediaDetailPath, mediaListPath, parseMediaAsset, parseMediaList } from "./schemas";
import type { MediaAsset, MediaList } from "./types";

export const mediaKeys = {
  all: ["media"] as const,
  list: (query: ListQuery) => ["media", "list", query.limit, query.cursor] as const,
  detail: (id: string) => ["media", "detail", id] as const,
};

function readList(result: FetchResult<unknown>): FetchResult<MediaList> {
  if (result.status !== "success") return result;
  const data = parseMediaList(result.data);
  if (!data) return { status: "invalid-response" };
  return { status: "success", data };
}

function readOne(result: FetchResult<unknown>): FetchResult<MediaAsset> {
  if (result.status !== "success") return result;
  const data = parseMediaAsset(result.data);
  if (!data) return { status: "invalid-response" };
  return { status: "success", data };
}

export async function getMediaList(query: ListQuery): Promise<FetchResult<MediaList>> {
  return readList(await fetchPublic(mediaListPath(query), 60, "media"));
}

export async function getMedia(id: string): Promise<FetchResult<MediaAsset>> {
  return readOne(await fetchPublic(mediaDetailPath(id), 60, "media"));
}

export async function getAdminMediaList(query: ListQuery): Promise<FetchResult<MediaList>> {
  return readList(await fetchAuthed(mediaListPath(query)));
}

export async function getAdminMedia(id: string): Promise<FetchResult<MediaAsset>> {
  return readOne(await fetchAuthed(mediaDetailPath(id)));
}
