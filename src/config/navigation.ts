import { externalLinkMessages } from "@/features/external-links/messages";
import { mediaMessages } from "@/features/media/messages";
import { pageMessages } from "@/features/pages/messages";

export interface NavItem {
  href: string;
  label: string;
}

export const publicNav: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/media", label: mediaMessages.title },
  { href: "/external-links", label: externalLinkMessages.title },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/media", label: mediaMessages.title },
  { href: "/admin/external-links", label: externalLinkMessages.title },
  { href: "/admin/pages", label: pageMessages.title },
];
