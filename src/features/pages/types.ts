import type { PageDocument } from "./document";

export interface RenderedNotice {
  id: string;
  title: string;
  date: string;
}

export interface PageMediaItem {
  kind: "IMAGE" | "VIDEO";
  publicUrl: string;
  alt: string | null;
}

export type PageMedia = Record<string, PageMediaItem>;

export interface PageMenuItem {
  title: string;
  slug: string;
  sortOrder: number;
  children: PageMenuItem[];
}

export interface PageMenu {
  items: PageMenuItem[];
}

export interface PageSummary {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  isSystem: boolean;
  showInMenu: boolean;
  sortOrder: number;
  parentId: string | null;
}

export interface PageSummaryList {
  items: PageSummary[];
  nextCursor: string | null;
}

export interface ManagedPage extends PageSummary {
  seoTitle: string | null;
  seoDescription: string | null;
  content: PageDocument;
  media: PageMedia;
}

export interface PublicPage {
  title: string;
  slug: string;
  seoTitle: string | null;
  seoDescription: string | null;
  content: PageDocument;
  media: PageMedia;
}
