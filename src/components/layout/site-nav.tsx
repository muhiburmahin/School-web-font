"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Mail, Menu, Phone } from "lucide-react";
import { SafeImage } from "@/components/safe/safe-image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuPopup, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCopy } from "@/i18n/copy";
import { LanguageToggle } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";

export interface NavLink {
  href: string;
  label: string;
  children?: NavLink[];
}

export function SiteNav({
  name,
  initial,
  logoUrl,
  logoFallback,
  links,
  accountHref,
  signedIn,
  email,
  phone,
  nameBn,
  tagline,
  barColor,
  compact,
  admissionHref,
  homeHref = "/",
}: {
  name: string;
  initial: string;
  logoUrl: string | null;
  logoFallback: string;
  links: NavLink[];
  accountHref: string;
  signedIn: boolean;
  email: string | null;
  phone: string | null;
  nameBn: string;
  tagline: string;
  barColor: string;
  compact: boolean;
  admissionHref: string | null;
  homeHref?: string;
}) {
  const nav = useCopy("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const accountLabel = signedIn ? nav.dashboard : nav.login;
  return (
    <>
    <header>
      {compact || (!tagline && !admissionHref) ? null : (
      <div className="text-white" style={{ backgroundColor: barColor }}>
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2 text-xs sm:text-sm">
          {admissionHref ? <Link href={admissionHref} className="shrink-0 rounded-md bg-background px-2 py-1 font-semibold text-foreground underline decoration-2 underline-offset-4">{nav.admission}</Link> : null}
          {tagline ? <p className="min-w-0 flex-1 truncate text-center">{tagline}</p> : null}
        </div>
      </div>
      )}
      <div className="border-b bg-card text-card-foreground">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:py-4">
          {email ? (
          <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex">
            <Mail aria-hidden className="size-5 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block text-xs text-muted-foreground">{nav.mailUs}</span>
              <span className="block truncate font-medium">{email}</span>
            </span>
          </div>
          ) : <div className="hidden sm:block" />}
          <Link href={homeHref} className="flex flex-col items-center gap-1 text-center">
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full text-lg font-semibold text-white sm:size-14" style={{ backgroundColor: barColor }}>
              {logoUrl ? <SafeImage className="h-full w-full object-contain" src={logoUrl} alt="" fallback={initial || logoFallback} /> : initial}
            </span>
            <span className="text-lg font-semibold tracking-wide text-foreground sm:text-2xl">{name}</span>
            {nameBn ? <span className="text-sm text-muted-foreground">{nameBn}</span> : null}
          </Link>
          {phone ? (
          <div className="hidden min-w-0 items-center justify-end gap-2 text-sm sm:flex sm:justify-self-end">
            <Phone aria-hidden className="size-5 shrink-0 text-primary" />
            <span className="min-w-0 text-right">
              <span className="block text-xs text-muted-foreground">{nav.callUs}</span>
              <span className="block truncate font-medium">{phone}</span>
            </span>
          </div>
          ) : <div className="hidden sm:block" />}
          <div className="flex min-w-0 items-center justify-center gap-3 text-xs text-muted-foreground sm:hidden">
            {email ? <span className="truncate">{email}</span> : null}
            {phone ? <span className="shrink-0">{phone}</span> : null}
          </div>
        </div>
      </div>
    </header>
      <nav aria-label={nav.menu} className="sticky top-0 z-40 shadow-sm" style={{ backgroundColor: barColor }}>
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:px-4">
        <NavigationMenu className="hidden min-w-0 flex-1 overflow-x-auto text-white lg:block">
          <NavigationMenuList className="flex-nowrap">
            {links.map((item) =>
              item.children && item.children.length > 0 ? (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLink className={navLinkClass} closeOnClick render={<Link href={item.href} />} aria-current={currentPath(pathname, item.href) ? "page" : undefined}>{item.label}</NavigationMenuLink>
                    {item.children.map((child) => (
                      <NavigationMenuLink key={child.href} className={navLinkClass} closeOnClick render={<Link href={child.href} />} aria-current={currentPath(pathname, child.href) ? "page" : undefined}>{child.label}</NavigationMenuLink>
                    ))}
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink className={navLinkClass} render={<Link href={item.href} />} aria-current={currentPath(pathname, item.href) ? "page" : undefined}>{item.label}</NavigationMenuLink>
                </NavigationMenuItem>
              ),
            )}
          </NavigationMenuList>
          <NavigationMenuPopup />
        </NavigationMenu>
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-2">
          <div className="hidden items-center gap-2 lg:flex">
            <LanguageToggle className={barControl} />
            <ThemeToggle className={barControl} />
          </div>
          <Button nativeButton={false} render={<Link href={accountHref} />} size="sm" className="bg-white text-neutral-950 hover:bg-white/90">{accountLabel}</Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="lg:hidden" render={<Button type="button" size="sm" variant="outline" aria-label={nav.menu} />}>
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>{nav.menu}</SheetTitle></SheetHeader>
              <Accordion>
                {links.map((item) =>
                  item.children && item.children.length > 0 ? (
                    <AccordionItem key={item.href} value={item.href}>
                      <AccordionTrigger>{item.label}</AccordionTrigger>
                      <AccordionContent>
                        <Link href={item.href} onClick={() => setOpen(false)} aria-current={currentPath(pathname, item.href) ? "page" : undefined} className="rounded-md px-3 py-2 text-sm aria-[current=page]:border-s-4 aria-[current=page]:border-primary aria-[current=page]:bg-primary/10 aria-[current=page]:font-semibold">{item.label}</Link>
                        {item.children.map((child) => (
                          <Link key={child.href} href={child.href} onClick={() => setOpen(false)} aria-current={currentPath(pathname, child.href) ? "page" : undefined} className="rounded-md px-3 py-2 text-sm aria-[current=page]:border-s-4 aria-[current=page]:border-primary aria-[current=page]:bg-primary/10 aria-[current=page]:font-semibold">{child.label}</Link>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ) : (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={currentPath(pathname, item.href) ? "page" : undefined} className="rounded-md px-3 py-3 text-sm aria-[current=page]:border-s-4 aria-[current=page]:border-primary aria-[current=page]:bg-primary/10 aria-[current=page]:font-semibold">{item.label}</Link>
                  ),
                )}
              </Accordion>
              <div className="mt-4 flex items-center gap-2 px-4">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        </div>
      </nav>
    </>
  );
}

const navLinkClass = "text-white hover:bg-white/20! hover:text-white! focus-visible:ring-white aria-[current=page]:bg-white! aria-[current=page]:font-semibold aria-[current=page]:text-neutral-950! aria-[current=page]:underline aria-[current=page]:decoration-neutral-950 aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-4";
const barControl = "border-white/50 bg-white/15! text-white! hover:bg-white! hover:text-neutral-950!";

export function currentPath(pathname: string, href: string): boolean {
  const path = pathname.split("?")[0]?.replace(/\/$/, "") || "/";
  const target = href.split("?")[0]?.replace(/\/$/, "") || "/";
  return path === target;
}
