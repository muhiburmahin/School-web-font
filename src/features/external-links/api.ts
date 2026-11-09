import { fetchAuthed } from "@/lib/data/authed";
import { fetchPublic } from "@/lib/data/public";
import type { FetchResult } from "@/lib/data/result";
import { externalLinkDetailPath, externalLinkListPath, parseExternalLink, parseExternalLinkList, type ExternalLinkQuery } from "./schemas";
import type { ExternalLink, ExternalLinkList } from "./types";

export const externalLinkKeys = {
  all: ["external-links"] as const,
  list: (query: ExternalLinkQuery) => ["external-links", "list", query.limit, query.cursor, query.category] as const,
  detail: (id: string) => ["external-links", "detail", id] as const,
};

function readList(result: FetchResult<unknown>): FetchResult<ExternalLinkList> {
  if (result.status !== "success") return result;
  const data = parseExternalLinkList(result.data);
  if (!data) return { status: "invalid-response" };
  return { status: "success", data };
}

function readOne(result: FetchResult<unknown>): FetchResult<ExternalLink> {
  if (result.status !== "success") return result;
  const data = parseExternalLink(result.data);
  if (!data) return { status: "invalid-response" };
  return { status: "success", data };
}

export async function getExternalLinks(query: ExternalLinkQuery): Promise<FetchResult<ExternalLinkList>> {
  return readList(await fetchPublic(externalLinkListPath(query), 60, "external-links"));
}

export async function getExternalLink(id: string): Promise<FetchResult<ExternalLink>> {
  return readOne(await fetchPublic(externalLinkDetailPath(id), 60, "external-links"));
}

export async function getAdminExternalLinks(query: ExternalLinkQuery): Promise<FetchResult<ExternalLinkList>> {
  return readList(await fetchAuthed(externalLinkListPath(query)));
}

export async function getAdminExternalLink(id: string): Promise<FetchResult<ExternalLink>> {
  return readOne(await fetchAuthed(externalLinkDetailPath(id)));
}
