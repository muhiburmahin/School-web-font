import { recordList, textOf } from "@/features/content/safe-url";
import { formatDhaka } from "@/i18n/text";
import { fetchPublic } from "@/lib/data/public";
import type { RenderedNotice } from "@/features/pages/components/block-renderer";

export async function publishedNotices(locale: string, limit: number): Promise<RenderedNotice[]> {
  const result = await fetchPublic("/api/v1/notices", 30, "notices");
  if (result.status !== "success") return [];
  const items = recordList(result.data) ?? [];
  return items
    .map((notice) => {
      const date = textOf(notice.noticeDate);
      return {
        id: textOf(notice.id) || textOf(notice.title),
        title: textOf(notice.title),
        date: date ? formatDhaka(date, locale) : "",
      };
    })
    .filter((notice) => notice.id && notice.title)
    .slice(0, limit);
}
