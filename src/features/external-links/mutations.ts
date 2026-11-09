import { backendContract } from "@/config/backend-contract";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/api-client";
import {
  externalLinkAdminListPath,
  externalLinkResourcePath,
  parseAdminExternalLinkList,
  type ExternalLinkFormValues,
  type ExternalLinkQuery,
} from "./schemas";
import type { ExternalLinkList } from "./types";

export async function fetchManagedLinks(query: ExternalLinkQuery): Promise<ExternalLinkList> {
  const data = await apiFetch<unknown>(externalLinkAdminListPath(query));
  const parsed = parseAdminExternalLinkList(data);
  if (!parsed) {
    throw new ApiError({ status: 0, kind: "client", messages: [] });
  }
  return parsed;
}

export function createExternalLink(input: ExternalLinkFormValues): Promise<unknown> {
  return apiFetch(backendContract.externalLinks.create.path, { method: "POST", body: input });
}

export function updateExternalLink(id: string, input: ExternalLinkFormValues): Promise<unknown> {
  return apiFetch(externalLinkResourcePath(backendContract.externalLinks.update.path, id), {
    method: "PATCH",
    body: input,
  });
}

export function setExternalLinkActive(id: string, isActive: boolean): Promise<unknown> {
  return apiFetch(externalLinkResourcePath(backendContract.externalLinks.active.path, id), {
    method: "PATCH",
    body: { isActive },
  });
}

export function deleteExternalLink(id: string): Promise<unknown> {
  return apiFetch(externalLinkResourcePath(backendContract.externalLinks.remove.path, id), { method: "DELETE" });
}

export function reorderExternalLinks(items: { id: string; sortOrder: number }[]): Promise<unknown> {
  return apiFetch(backendContract.externalLinks.reorder.path, { method: "PATCH", body: { items } });
}
