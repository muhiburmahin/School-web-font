import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkChangesNotice } from "@/features/external-links/components/changes-notice";
import { LinkList } from "@/features/external-links/components/link-list";
import { externalLinkMessages } from "@/features/external-links/messages";
import { externalLinkAdminListPath, externalLinkFormSchema, externalLinkListPath, parseAdminExternalLinkList, parseExternalLinkList, swapSortOrders } from "@/features/external-links/schemas";

const link = {
  id: "22222222-2222-4222-8222-222222222222",
  labelBn: "পোর্টাল",
  labelEn: "Portal",
  url: "https://school.example/portal",
  category: "EMS_PORTAL",
  isActive: false,
  sortOrder: 1,
};

describe("external links", () => {
  it("rejects an unsafe URL and keeps an inactive https link", () => {
    expect(parseExternalLinkList({ items: [{ ...link, url: "javascript:alert(1)" }], nextCursor: null })).toBeNull();
    const list = parseExternalLinkList({ items: [link], nextCursor: null });
    expect(list?.items[0]?.isActive).toBe(false);
    expect(list?.items[0]?.url).toBe("https://school.example/portal");
  });

  it("sends only limit, cursor, and category", () => {
    expect(externalLinkListPath({ limit: 10, cursor: null, category: "ADMISSION" })).toBe(
      "/api/v1/external-links?limit=10&category=ADMISSION",
    );
  });

  it("shows the read-only notice and does not offer a write action", () => {
    render(
      <div>
        <LinkChangesNotice />
        <LinkList items={[link]} detailBase="/external-links" nextHref={null} />
      </div>,
    );
    expect(screen.getByText(externalLinkMessages.changesUnavailable)).toBeInTheDocument();
    expect(screen.getByText(externalLinkMessages.inactive)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete|edit|create|upload/i })).not.toBeInTheDocument();
    const portal = screen.getByRole("link", { name: "https://school.example/portal" });
    expect(portal).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("rejects attack URLs and a client institution id", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,hi", "https://user:pass@school.example/hidden", "http://school.example/portal"]) {
      expect(externalLinkFormSchema.safeParse({ labelBn: "লিংক", labelEn: "Link", url, category: "OTHER", sortOrder: 1 }).success).toBe(false);
    }
    expect(externalLinkFormSchema.safeParse({ labelBn: "লিংক", labelEn: "Link", url: "https://school.example/portal", category: "OTHER", sortOrder: 1, institutionId: "11111111-1111-4111-8111-111111111111" }).success).toBe(false);
  });

  it("builds the admin list path and keeps admin fields", () => {
    expect(externalLinkAdminListPath({ limit: 20, cursor: null, category: null })).toBe("/api/v1/external-links/admin?limit=20");
    const createdById = "99999999-9999-4999-8999-999999999999";
    const list = parseAdminExternalLinkList({
      items: [{ ...link, lastVerifiedAt: null, createdById, createdAt: "2026-10-22T00:00:00.000Z", updatedAt: "2026-10-22T00:00:00.000Z" }],
      nextCursor: null,
    });
    expect(list?.items[0]).toEqual(expect.objectContaining({ createdById }));
    expect(swapSortOrders([link, { ...link, id: "33333333-3333-4333-8333-333333333333", sortOrder: 2 }], 0, 1)?.items).toEqual([
      { id: link.id, sortOrder: 2 },
      { id: "33333333-3333-4333-8333-333333333333", sortOrder: 1 },
    ]);
  });
});
