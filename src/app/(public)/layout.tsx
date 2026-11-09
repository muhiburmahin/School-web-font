import { Suspense } from "react";
import { headers } from "next/headers";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getInstitutionProfile, toProfileView } from "@/features/institution-profile/api";
import { getPageMenu } from "@/features/pages/api";
import { copy } from "@/i18n/server-copy";
import { verifySession } from "@/lib/auth/dal";
import { institutionThemeCss } from "@/lib/theme-colors";
import { getMenuLabels } from "@/lib/public-navigation";
import { requestDevSiteSlug } from "@/lib/tenant-host";

export async function generateMetadata() {
  const loaded = await getInstitutionProfile();
  const profile = toProfileView(loaded.status === "success" ? loaded.data : null);
  return {
    title: profile.title,
    icons: profile.faviconUrl ? { icon: profile.faviconUrl } : undefined,
  };
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton label="…" />}>
      <PublicChrome>{children}</PublicChrome>
    </Suspense>
  );
}

async function PublicChrome({ children }: { children: React.ReactNode }) {
  const [loaded, menu, session, nav, previewSlug, headerLabels, footerLabels, headersList] = await Promise.all([
    getInstitutionProfile(),
    getPageMenu(),
    verifySession(),
    copy("nav"),
    requestDevSiteSlug(),
    getMenuLabels("HEADER"),
    getMenuLabels("FOOTER"),
    headers(),
  ]);

  const profile = toProfileView(loaded.status === "success" ? loaded.data : null);
  const previewBase = previewSlug ? `/preview/${previewSlug}` : "";
  const theme = institutionThemeCss(profile);
  const fontClass = profile.font === "serif" ? "font-serif" : "font-sans";

  const pathname = headersList.get("x-pathname") || "";
  const isHomepage = pathname === "/" || pathname === "";

  if (isHomepage) {
    return (
      <div className={`overflow-visible ${fontClass}`}>
        {theme ? <style dangerouslySetInnerHTML={{ __html: theme }} /> : null}
        {children}
      </div>
    );
  }

  return (
    <div className={`overflow-visible ${fontClass}`}>
      {theme ? <style dangerouslySetInnerHTML={{ __html: theme }} /> : null}
      <a className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-md focus:bg-background focus:px-3 focus:py-2" href="#content">
        {nav.skip}
      </a>
      <SiteHeader
        profile={profile}
        menu={menu}
        signedIn={session.status === "authenticated"}
        accountHref={session.status !== "authenticated" ? "/login?next=/admin" : session.user.roles.includes("SUPER_ADMIN") && !session.user.roles.includes("SITE_ADMIN") ? "/platform" : "/admin"}
        previewBase={previewBase}
        menuLabels={headerLabels}
      />
      <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <SiteFooter profile={profile} menu={menu} menuLabels={footerLabels} previewBase={previewBase} />
    </div>
  );
}
