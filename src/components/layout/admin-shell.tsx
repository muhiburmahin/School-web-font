import { InstitutionFrame, type DashboardGroup } from "@/components/layout/dashboard-frame";
import type { CurrentUser } from "@/features/auth/types";
import { copy } from "@/i18n/server-copy";

export async function AdminShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const [dashboard, auth, links, nav] = await Promise.all([copy("dashboard"), copy("auth"), copy("externalLinks"), copy("nav")]);
  const groups: DashboardGroup[] = [
    { label: dashboard.overview, items: [{ href: "/admin", label: dashboard.overview }] },
    {
      label: dashboard.website,
      items: [
        { href: "/admin/profile", label: "Profile & Identity" },
        { href: "/admin/theme", label: dashboard.theme },
        { href: "/admin/media", label: dashboard.media },
      ],
    },
    {
      label: dashboard.content,
      items: [
        { href: "/admin/pages", label: dashboard.pages },
        { href: "/admin/notices", label: dashboard.notices },
        { href: "/admin/staff", label: dashboard.staff },
        { href: "/admin/gallery", label: dashboard.gallery },
        { href: "/admin/external-links", label: links.title },
        { href: "/admin/contact", label: nav.contact },
      ],
    },
    {
      label: dashboard.navigationGroup,
      items: [
        { href: "/admin/navigation", label: dashboard.headerMenu },
        { href: "/admin/navigation/footer", label: dashboard.footerMenu },
      ],
    },
    {
      label: dashboard.settings,
      items: [
        { href: "/admin/domains", label: "Custom Domains" },
        { href: "/admin/users", label: "Admin Users" },
        { href: "/admin/password", label: dashboard.account },
      ],
    },
  ];
  return (
    <InstitutionFrame
      title={dashboard.overview}
      groups={groups}
      user={user}
      accountHref="/admin/password"
      labels={{ collapse: dashboard.collapse, expand: dashboard.expand, openMenu: dashboard.openMenu, accountMenu: dashboard.account, signOut: auth.signOut }}
    >
      {children}
    </InstitutionFrame>
  );
}
