import Link from "next/link";
import { copy } from "@/i18n/server-copy";
import { byLocale } from "@/i18n/text";
import { getLocale } from "next-intl/server";
import { getExternalLinks } from "@/features/external-links/api";
import type { ProfileView } from "@/features/institution-profile/types";
import type { FetchResult } from "@/lib/data/result";
import type { PageMenu } from "@/features/pages/types";
import { publicMenuLabel } from "@/lib/menu-label";
import { canonicalPagePath, type PublicMenuLabel } from "@/lib/public-navigation";
import { previewHref } from "@/lib/tenant-host";

export async function SiteFooter({ profile, menu, menuLabels = {}, previewBase = "" }: { profile: ProfileView; menu: FetchResult<PageMenu>; menuLabels?: Record<string, PublicMenuLabel>; previewBase?: string }) {
  const locale = await getLocale();
  const footer = await copy("footer");
  const nav = await copy("nav");
  const name = byLocale(locale, profile.nameBn, profile.nameEn);
  const address = byLocale(locale, profile.addressBn, profile.addressEn);
  const place = byLocale(locale, profile.upazila?.nameBn, profile.upazila?.nameEn);
  const district = byLocale(locale, profile.district?.nameBn, profile.district?.nameEn);
  const links = await getExternalLinks({ limit: 6, cursor: null, category: null });
  const external = links.status === "success" ? links.data.items.filter((item) => item.isActive) : [];
  const year = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "bn-BD", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    numberingSystem: locale === "en" ? "latn" : "beng",
  }).format(new Date());

  return (
    <footer className="mt-auto border-t">
      <div className={`mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 ${profile.footer === "simple" ? "" : external.length > 0 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
        <div className="grid gap-2 text-sm">
          <p className="font-semibold text-foreground">{name}</p>
          {address ? <p className="text-muted-foreground">{address}</p> : null}
          {[place, district].filter(Boolean).join(", ") ? <p className="text-muted-foreground">{[place, district].filter(Boolean).join(", ")}</p> : null}
          {profile.officialPhone ? <p className="text-muted-foreground">{profile.officialPhone}</p> : null}
          {profile.officialEmail ? <p className="text-muted-foreground">{profile.officialEmail}</p> : null}
        </div>
        <div className="grid gap-2 text-sm">
          <p className="font-semibold">{footer.quickLinks}</p>
          <Link className="rounded-md focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none" href={previewHref(previewBase, "/")}>{nav.home}</Link>
          {menu.status === "success"
            ? menu.data.items
                .filter((item) => item.slug !== "home")
                .map((item) => (
                  <Link
                    key={item.slug}
                    className="rounded-md focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
                    href={previewHref(previewBase, canonicalPagePath(item.slug))}
                  >
                    {publicMenuLabel({ slug: item.slug, pageTitle: item.title, labelBn: menuLabels[item.slug]?.labelBn, labelEn: menuLabels[item.slug]?.labelEn, locale })}
                  </Link>
                ))
            : <p className="text-muted-foreground">{nav.unavailable}</p>}
        </div>
        {external.length > 0 ? (
        <div className="grid gap-2 text-sm">
          <p className="font-semibold">{footer.links}</p>
          {external.map((item) => (
            <a key={item.id} className="truncate rounded-md focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none" href={item.url} rel="noopener noreferrer" target="_blank">
              {byLocale(locale, item.labelBn, item.labelEn)}
            </a>
          ))}
        </div>
        ) : null}
      </div>
      <p className="border-t px-4 py-4 text-center text-xs text-muted-foreground">{year} {name}. {footer.copyright}</p>
    </footer>
  );
}
