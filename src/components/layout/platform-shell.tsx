import { DashboardFrame, type DashboardGroup } from "@/components/layout/dashboard-frame";
import type { CurrentUser } from "@/features/auth/types";
import { copy } from "@/i18n/server-copy";

export async function PlatformShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const [platformMessages, auth, dashboard] = await Promise.all([copy("platform"), copy("auth"), copy("dashboard")]);
  const groups: DashboardGroup[] = [
    {
      label: platformMessages.summaryTitle,
      items: [
        { href: "/platform", label: platformMessages.summaryTitle },
        { href: "/platform/audit", label: platformMessages.navAudit },
        { href: "/platform/password", label: platformMessages.navPassword },
      ],
    },
  ];
  return (
    <DashboardFrame
      title={platformMessages.summaryTitle}
      groups={groups}
      user={user}
      accountHref="/platform/password"
      labels={{ collapse: dashboard.collapse, expand: dashboard.expand, openMenu: dashboard.openMenu, accountMenu: dashboard.account, signOut: auth.signOut }}
    >
      {children}
    </DashboardFrame>
  );
}
