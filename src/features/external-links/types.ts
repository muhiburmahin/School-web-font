import type { LinkCategory } from "@/lib/validation/query";

export type { LinkCategory };

export interface ExternalLink {
  id: string;
  labelBn: string;
  labelEn: string;
  url: string;
  category: LinkCategory;
  isActive: boolean;
  sortOrder: number;
}

export interface ExternalLinkList {
  items: ExternalLink[];
  nextCursor: string | null;
}

export interface AdminExternalLink extends ExternalLink {
  lastVerifiedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
