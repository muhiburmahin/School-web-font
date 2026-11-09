import { SiteNav, type NavLink } from "@/components/layout/site-nav";
import { byLocale } from "@/i18n/text";
import { publicMenuLabel, sameInstitutionName } from "@/lib/menu-label";
import { canonicalPagePath, type PublicMenuLabel } from "@/lib/public-navigation";
import { previewHref } from "@/lib/tenant-host";
import { copy } from "@/i18n/server-copy";
import { getLocale } from "next-intl/server";
import type { ProfileView } from "@/features/institution-profile/types";
import type { FetchResult } from "@/lib/data/result";
import type { PageMenu } from "@/features/pages/types";

export async function SiteHeader({
  profile,
  menu,
  menuLabels = {},
  signedIn,
  accountHref,
  previewBase = "",
}: {
  profile: ProfileView;
  menu: FetchResult<PageMenu>;
  menuLabels?: Record<string, PublicMenuLabel>;
  signedIn: boolean;
  accountHref: string;
  previewBase?: string;
}) {
  const locale = await getLocale();
  const nav = await copy("nav");
  const name = byLocale(locale, profile.nameBn, profile.nameEn) || nav.home;
  const otherName = locale === "en" ? profile.nameBn : profile.nameEn;
  const labelFor = (slug: string, pageTitle: string) =>
    publicMenuLabel({
      slug,
      pageTitle,
      labelBn: menuLabels[slug]?.labelBn,
      labelEn: menuLabels[slug]?.labelEn,
      locale,
    });
  const links: NavLink[] = [{ href: previewHref(previewBase, "/"), label: nav.home }];
  if (menu.status === "success") {
    for (const item of menu.data.items) {
      if (item.slug === "home") continue;
      links.push({
        href: previewHref(previewBase, canonicalPagePath(item.slug)),
        label: labelFor(item.slug, item.title),
        children: item.children.map((child) => ({ href: previewHref(previewBase, `/${item.slug}/${child.slug}`), label: labelFor(child.slug, child.title) })),
      });
    }
  } else {
    links.push(
      { href: previewHref(previewBase, "/notices"), label: nav.notices },
      { href: previewHref(previewBase, "/staff"), label: nav.staff },
      { href: previewHref(previewBase, "/gallery/albums"), label: nav.gallery },
      { href: previewHref(previewBase, "/contact/send"), label: nav.contact },
    );
  }
  const canonicalNoticePath = previewHref(previewBase, "/notices");
  if (!links.some((item) => item.href === canonicalNoticePath)) links.push({ href: canonicalNoticePath, label: nav.notices });
  const admission = links.find((item) => item.href === previewHref(previewBase, "/admission"));
  const barColor = /^#[0-9A-Fa-f]{6}$/.test(profile.primaryColor ?? "") ? profile.primaryColor ?? "#0c2340" : "#0c2340";
  const compact = profile.header === "compact";
  const tagline = byLocale(locale, profile.addressBn, profile.addressEn);
  return (
    <SiteNav
      name={name}
      nameBn={sameInstitutionName(name, otherName) ? "" : otherName}
      initial={(name.trim().slice(0, 1) || "I").toLocaleUpperCase(locale)}
      logoUrl={profile.logoUrl}
      logoFallback=""
      links={links}
      accountHref={accountHref}
      signedIn={signedIn}
      email={profile.officialEmail}
      phone={profile.officialPhone}
      tagline={tagline}
      barColor={barColor}
      compact={compact}
      admissionHref={admission ? admission.href : null}
      homeHref={previewHref(previewBase, "/")}
    />
  );
}
