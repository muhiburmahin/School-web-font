import { backendContract } from "@/config/backend-contract";
import { fetchPublic } from "@/lib/data/public";

export interface PublicMenuLabel {
  labelBn: string;
  labelEn: string;
}

export function canonicalPagePath(slug: string): string {
  const clean = slug.replace(/^\/+/, "");
  if (!clean || clean === "home") return "/";
  if (clean === "notice-board") return "/notices";
  return `/${clean}`;
}

export async function getMenuLabels(location: "HEADER" | "FOOTER"): Promise<Record<string, PublicMenuLabel>> {
  const result = await fetchPublic(`${backendContract.navigation.list.path}?location=${location}`, 60, "navigation");
  if (result.status !== "success" || !result.data || typeof result.data !== "object") return {};
  const items = (result.data as { items?: unknown }).items;
  if (!Array.isArray(items)) return {};
  const labels: Record<string, PublicMenuLabel> = {};
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const row = item as { slug?: unknown; labelBn?: unknown; labelEn?: unknown };
    if (typeof row.slug !== "string" || typeof row.labelBn !== "string" || typeof row.labelEn !== "string") continue;
    labels[row.slug] = { labelBn: row.labelBn, labelEn: row.labelEn };
  }
  return labels;
}
