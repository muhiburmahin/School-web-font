import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getPageMenu } from "@/features/pages/api";
import { canonicalPagePath } from "@/lib/public-navigation";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;
  const paths = new Set(["/", "/media", "/external-links"]);
  const menu = await getPageMenu();
  if (menu.status === "success") {
    for (const item of menu.data.items) {
      paths.add(canonicalPagePath(item.slug));
      for (const child of item.children) paths.add(`/${item.slug}/${child.slug}`);
    }
  }
  return [...paths].map((path) => ({ url: `${origin}${path}` }));
}
