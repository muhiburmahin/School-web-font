import { backendContract } from "@/config/backend-contract";

const cursorPattern = /^[A-Za-z0-9_-]{1,200}$/;
const limitPattern = /^\d{1,2}$/;

export const linkCategories = backendContract.externalLinks.categories;
export type LinkCategory = (typeof linkCategories)[number];

export interface ListQuery {
  limit: number;
  cursor: string | null;
}

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export function firstQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseLimit(value: string | undefined): number {
  if (value === undefined || value === "") return backendContract.pagination.limitDefault;
  if (!limitPattern.test(value)) return backendContract.pagination.limitDefault;
  const limit = Number(value);
  if (limit < backendContract.pagination.limitMin || limit > backendContract.pagination.limitMax) {
    return backendContract.pagination.limitDefault;
  }
  return limit;
}

export function parseCursor(value: string | undefined): string | null {
  if (!value) return null;
  return cursorPattern.test(value) ? value : null;
}

export function parseListQuery(params: SearchParamsInput): ListQuery {
  return {
    limit: parseLimit(firstQueryValue(params.limit)),
    cursor: parseCursor(firstQueryValue(params.cursor)),
  };
}

export function parseCategory(value: string | undefined): { ok: true; category: LinkCategory | null } | { ok: false } {
  if (!value) return { ok: true, category: null };
  if ((linkCategories as readonly string[]).includes(value)) {
    return { ok: true, category: value as LinkCategory };
  }
  return { ok: false };
}
