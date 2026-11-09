"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { logout } from "@/features/auth/api";
import type { CurrentUser } from "@/features/auth/types";
import { fetchInstitutionSummary } from "@/features/dashboard/api";

export type DashboardLink = { href: string; label: string };
export type DashboardGroup = { label: string; items: DashboardLink[] };

export function DashboardFrame({
  title,
  groups,
  user,
  children,
  accountHref,
  labels,
  identity,
}: {
  title: string;
  groups: DashboardGroup[];
  user: CurrentUser;
  children: React.ReactNode;
  accountHref: string;
  labels: { collapse: string; expand: string; openMenu: string; accountMenu: string; signOut: string };
  identity?: { name: string; logoUrl: string | null };
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  async function signOut() {
    try {
      await logout();
    } finally {
      queryClient.clear();
      router.push("/login");
      router.refresh();
    }
  }
  return (
    <div className="min-h-full bg-muted/30">
      <div className="flex min-h-full">
        {collapsed ? null : (
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-background md:flex">
            <Sidebar title={title} groups={groups} identity={identity} />
          </aside>
        )}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger render={<Button type="button" variant="outline" size="icon-sm" className="md:hidden" aria-label={labels.openMenu} />}>
                  <MenuIcon />
                </SheetTrigger>
                <SheetContent className="left-0 right-auto w-72 data-open:slide-in-from-left data-closed:slide-out-to-left">
                  <SheetHeader>
                    <p className="text-sm font-semibold">{title}</p>
                  </SheetHeader>
                  <Sidebar title={title} groups={groups} identity={identity} />
                </SheetContent>
              </Sheet>
              <Button type="button" variant="outline" size="icon-sm" className="hidden md:inline-flex" aria-label={collapsed ? labels.expand : labels.collapse} onClick={() => setCollapsed((value) => !value)}>
                {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
              </Button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{identity?.name || title}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button type="button" variant="outline" aria-label={labels.accountMenu} />}>
                {user.displayName}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem render={<Link href={accountHref} />}>{labels.accountMenu}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void signOut()}>{labels.signOut}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <div className="px-4 py-6 sm:px-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function InstitutionFrame(props: {
  title: string;
  groups: DashboardGroup[];
  user: CurrentUser;
  children: React.ReactNode;
  accountHref: string;
  labels: { collapse: string; expand: string; openMenu: string; accountMenu: string; signOut: string };
}) {
  const summary = useQuery({ queryKey: ["institution-dashboard"], queryFn: fetchInstitutionSummary });
  const identity = summary.data ? { name: summary.data.nameEn, logoUrl: summary.data.logoUrl } : undefined;
  return <DashboardFrame {...props} identity={identity} />;
}

function Sidebar({ title, groups, identity }: { title: string; groups: DashboardGroup[]; identity?: { name: string; logoUrl: string | null } }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto px-3 py-4">
      <div className="flex items-center gap-3 px-2">
        {identity?.logoUrl ? <img src={identity.logoUrl} alt="" className="h-10 w-10 rounded-md object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">{(identity?.name || title).slice(0, 1)}</div>}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{identity?.name || title}</p>
          <p className="truncate text-xs text-muted-foreground">{title}</p>
        </div>
      </div>
      {groups.map((group) => (
        <nav key={group.label} aria-label={group.label} className="grid gap-1">
          <p className="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{group.label}</p>
          <ul className="grid gap-1">
            {group.items.map((item) => {
              const active = item.href === pathname || (item.href !== "/admin" && item.href !== "/platform" && pathname.startsWith(`${item.href}/`));
              return (
                <li key={`${item.href}-${item.label}`}>
                  <Link className={`block rounded-md px-2 py-1.5 text-sm focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none ${active ? "bg-muted font-medium" : "hover:bg-muted/70"}`} href={item.href} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ))}
    </div>
  );
}
