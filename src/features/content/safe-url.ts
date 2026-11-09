export function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function recordList(data: unknown): Record<string, unknown>[] | null {
  if (!data || typeof data !== "object" || !("items" in data)) return null;
  const items = (data as { items: unknown }).items;
  if (!Array.isArray(items)) return null;
  if (!items.every((item) => item && typeof item === "object")) return null;
  return items as Record<string, unknown>[];
}

export function textOf(value: unknown): string {
  return typeof value === "string" ? value : "";
}
