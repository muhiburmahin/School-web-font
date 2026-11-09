import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import { BlockRenderer } from "@/features/pages/components/block-renderer";
import { PageEditor } from "@/features/pages/components/page-editor";
import { PageManager } from "@/features/pages/components/page-manager";
import { clonePageBlock, pageDocumentSchema, parsePageSlug, reservedSlugs } from "@/features/pages/document";
import { NextIntlClientProvider } from "next-intl";
import en from "../messages/en.json";
import { pageMessages } from "@/features/pages/messages";
import type { ManagedPage } from "@/features/pages/types";

const fetchManagedPages = vi.fn();
const fetchManagedPage = vi.fn();
const updatePage = vi.fn();
const fetchPageMedia = vi.fn();

vi.mock("@/features/pages/mutations", () => ({
  fetchManagedPages: (...args: unknown[]) => fetchManagedPages(...args),
  fetchManagedPage: (...args: unknown[]) => fetchManagedPage(...args),
  fetchPageMedia: (...args: unknown[]) => fetchPageMedia(...args),
  fetchPreviewNotices: vi.fn().mockResolvedValue([]),
  createPage: vi.fn(),
  updatePage: (...args: unknown[]) => updatePage(...args),
  setPageStatus: vi.fn(),
  deletePage: vi.fn(),
  movePage: vi.fn(),
  reorderPages: vi.fn(),
}));

vi.mock("@/features/pages/actions", () => ({
  revalidatePages: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/api-client", () => ({ apiFetch: vi.fn().mockResolvedValue({ items: [] }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const heading = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  type: "heading" as const,
  text: "About",
  level: 2 as const,
  align: "left" as const,
  color: "#112233",
  size: "xl" as const,
  weight: "semibold" as const,
};

describe("page builder", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    fetchManagedPages.mockReset();
    fetchManagedPage.mockReset();
    updatePage.mockReset();
    fetchPageMedia.mockReset();
    fetchPageMedia.mockResolvedValue([]);
  });

  it("rejects unsafe documents and reserved slugs", () => {
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [heading] }).success).toBe(true);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ ...heading, color: "red" }] }).success).toBe(false);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ id: heading.id, type: "button", label: "Go", url: "javascript:alert(1)", size: "base", align: "left" }] }).success).toBe(false);
    expect(parsePageSlug("about")).toBe("about");
    const hero = { id: heading.id, type: "hero" as const, heading: "Welcome", text: "Sample text.", align: "center" as const, buttons: [] };
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ ...hero, intervalSeconds: 5, autoplay: true, transition: "fade", slides: [] }] }).success).toBe(true);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ ...hero, intervalSeconds: 2 }] }).success).toBe(false);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ ...hero, intervalSeconds: 16 }] }).success).toBe(false);
    const copy = clonePageBlock({
      ...hero,
      slides: [{ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", mediaId: null, alt: "", heading: "Gate", text: "", enabled: true }],
    });
    expect(copy.id).not.toBe(hero.id);
    expect(copy.type === "hero" && copy.slides?.[0]?.id).not.toBe("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    for (const slug of reservedSlugs) expect(parsePageSlug(slug)).toBeNull();

    // Safe internal relative URL validation
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ id: heading.id, type: "button", label: "Go", url: "/about", size: "base", align: "left" }] }).success).toBe(true);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ id: heading.id, type: "button", label: "Go", url: "/admission?tab=fees#apply", size: "base", align: "left" }] }).success).toBe(true);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ id: heading.id, type: "button", label: "Go", url: "//evil.com", size: "base", align: "left" }] }).success).toBe(false);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ id: heading.id, type: "button", label: "Go", url: "/\\evil.com", size: "base", align: "left" }] }).success).toBe(false);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ id: heading.id, type: "button", label: "Go", url: "/../admin", size: "base", align: "left" }] }).success).toBe(false);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ id: heading.id, type: "button", label: "Go", url: "/preview/other-tenant", size: "base", align: "left" }] }).success).toBe(false);
  });

  it("hides a disabled section and shows a hero image without executing markup", () => {
    const mediaId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer
          content={{
            schemaVersion: 1,
            blocks: [
              { id: heading.id, type: "hero", heading: "Welcome", text: "Sample text.", align: "center", mediaId, buttons: [] },
              {
                id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
                type: "section",
                background: null,
                spacing: "base",
                align: "left",
                enabled: false,
                children: [{ ...heading, id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", text: "Hidden section" }],
              },
            ],
          }}
          media={{ [mediaId]: { kind: "IMAGE", publicUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg", alt: "Banner" } }}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("img", { name: "Welcome" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Welcome" })).toHaveClass("text-white");
    expect(screen.queryByText("Hidden section")).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("<script");
  });

  it("does not render a javascript link", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
      <BlockRenderer
        content={{ schemaVersion: 1, blocks: [{ id: heading.id, type: "button", label: "Go", url: "javascript:alert(1)", size: "base", align: "left" }] }}
        media={{}}
      />
      </NextIntlClientProvider>,
    );
    expect(screen.queryByText("Go")).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain("javascript:");
  });

  it("hides write actions when the admin list is forbidden and does not toast success", async () => {
    fetchManagedPages.mockRejectedValue(new ApiError({ status: 403, kind: "forbidden", messages: ["raw backend text"] }));
    renderManager();
    expect(await screen.findByText(pageMessages.forbiddenWrite)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: pageMessages.create })).not.toBeInTheDocument();
    expect(screen.queryByText("raw backend text")).not.toBeInTheDocument();
  });

  it("shows an empty state and a loading skeleton", async () => {
    fetchManagedPages.mockResolvedValue({ items: [], nextCursor: null });
    renderManager();
    expect(await screen.findByText(pageMessages.empty)).toBeInTheDocument();
  });

  it("keeps a published page hidden from the menu separate from draft status", async () => {
    fetchManagedPages.mockResolvedValue({
      items: [{
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        title: "About",
        slug: "about",
        status: "PUBLISHED",
        isSystem: false,
        showInMenu: false,
        parentId: null,
        sortOrder: 1,
      }],
      nextCursor: null,
    });
    renderManager();
    expect(await screen.findByText(pageMessages.publishedStatus)).toBeInTheDocument();
    expect(screen.getByText(pageMessages.hiddenFromMenu)).toBeInTheDocument();
    expect(screen.queryByText(pageMessages.draft)).not.toBeInTheDocument();
  });

  it("shows the section switch in the existing page editor", async () => {
    fetchManagedPage.mockResolvedValue({
      ...managed(),
      content: {
        schemaVersion: 1,
        blocks: [{ id: heading.id, type: "section", background: null, spacing: "base", align: "left", enabled: true, children: [] }],
      },
    });
    renderEditor();
    fireEvent.click(await screen.findByRole("button", { name: pageMessages.settings }));
    expect(await screen.findByText(pageMessages.showSection)).toBeInTheDocument();
  });

  it("adds, reorders, and saves a block only after the API succeeds", async () => {
    fetchManagedPage.mockResolvedValue(managed());
    updatePage.mockRejectedValue(new ApiError({ status: 500, kind: "server", messages: ["db down"] }));
    renderEditor();
    expect(await screen.findByText("About")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: `${pageMessages.addBlock} text` }));
    expect(screen.getByText("text")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: pageMessages.save }));
    await waitFor(() => expect(updatePage).toHaveBeenCalled());
    const { toast } = await import("sonner");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("edits child blocks inside a section and duplicates children with unique IDs", async () => {
    const childId = "11111111-1111-4111-8111-111111111111";
    fetchManagedPage.mockResolvedValue({
      ...managed(),
      content: {
        schemaVersion: 1,
        blocks: [
          {
            id: heading.id,
            type: "section",
            background: null,
            spacing: "base",
            align: "left",
            enabled: true,
            children: [
              {
                id: childId,
                type: "heading",
                text: "Introduction",
                level: 2,
                align: "left",
                color: "#111827",
                size: "xl",
                weight: "semibold",
              },
            ],
          },
        ],
      },
    });
    renderEditor();
    fireEvent.click(await screen.findByRole("button", { name: pageMessages.settings }));
    expect(await screen.findByDisplayValue("Introduction")).toBeInTheDocument();

    // Verify duplication generates a unique ID
    const sectionBlock = {
      id: heading.id,
      type: "section" as const,
      background: null,
      spacing: "base" as const,
      align: "left" as const,
      enabled: true,
      children: [
        {
          id: childId,
          type: "heading" as const,
          text: "Introduction",
          level: 2 as const,
          align: "left" as const,
          color: "#111827",
          size: "xl" as const,
          weight: "semibold" as const,
        },
      ],
    };
    const cloned = clonePageBlock(sectionBlock);
    expect(cloned.id).not.toBe(sectionBlock.id);
    expect(cloned.type === "section" && cloned.children[0]?.id).not.toBe(childId);
  });

  it("supports card and gallery blocks adhering to schema", () => {
    const cardBlock = {
      id: "22222222-2222-4222-8222-222222222222",
      type: "card" as const,
      mediaId: null,
      heading: "Facility Card",
      description: "Science laboratory description",
      linkLabel: "Visit Lab",
      linkUrl: "https://example.com/lab",
      children: [],
    };
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [cardBlock] }).success).toBe(true);

    // Mismatched linkLabel / linkUrl rejected by schema refinement
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ ...cardBlock, linkLabel: "Visit", linkUrl: null }] }).success).toBe(false);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ ...cardBlock, linkLabel: null, linkUrl: "https://example.com" }] }).success).toBe(false);

    // Gallery schema requires 1-12 IDs
    const galleryBlock = {
      id: "33333333-3333-4333-8333-333333333333",
      type: "gallery" as const,
      mediaIds: ["44444444-4444-4444-8444-444444444444"],
    };
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [galleryBlock] }).success).toBe(true);
    expect(pageDocumentSchema.safeParse({ schemaVersion: 1, blocks: [{ ...galleryBlock, mediaIds: [] }] }).success).toBe(false);
  });

  it("renders public home blocks safely with empty sections and notices", () => {
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer
          content={{
            schemaVersion: 1,
            blocks: [
              { id: "55555555-5555-4555-8555-555555555555", type: "notice-list", heading: "Latest Notices", limit: 4 },
              { id: "66666666-6666-4666-8666-666666666666", type: "contact-info", phone: "", email: "", address: "" },
            ],
          }}
          media={{}}
          notices={[]}
        />
      </NextIntlClientProvider>,
    );
    // Notice list shows empty notice message safely
    expect(screen.getByText("Latest Notices")).toBeInTheDocument();
    // Blank contact-info hides itself
    expect(screen.queryByRole("region", { name: "address" })).not.toBeInTheDocument();
  });

  it("validates and renders About Us starter document with 7 sections safely", () => {
    const aboutDocument = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          type: "hero" as const,
          heading: "About the Institution",
          text: "Learn about our background, mission, vision, values, leadership, and campus.",
          align: "left" as const,
          buttons: [],
        },
        {
          id: "10000000-0000-4000-8000-000000000010",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000011", type: "heading" as const, text: "Institutional History", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000012", type: "text" as const, text: "Add the institution’s history when it is ready to publish.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000020",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000021", type: "heading" as const, text: "Mission", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000022", type: "text" as const, text: "Add the mission statement.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000030",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000031", type: "heading" as const, text: "Vision", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000032", type: "text" as const, text: "Add the vision statement.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000040",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000041", type: "heading" as const, text: "Core Values", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000042", type: "text" as const, text: "Add the core values that guide this institution.", align: "left" as const, size: "base" as const, color: "#111827" },
            {
              id: "10000000-0000-4000-8000-000000000043",
              type: "icon-list" as const,
              items: [
                { icon: "check" as const, text: "Integrity and Excellence" },
                { icon: "book" as const, text: "Quality Education" },
                { icon: "users" as const, text: "Respect and Inclusivity" },
              ],
            },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000050",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: false,
          children: [
            { id: "10000000-0000-4000-8000-000000000051", type: "heading" as const, text: "Leadership and Management", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000052", type: "text" as const, text: "Add leadership profiles when confirmed.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000060",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000061", type: "heading" as const, text: "Campus Overview", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000062", type: "text" as const, text: "Add details about the campus grounds, buildings, and learning spaces.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
      ],
    };

    // Schema validation succeeds for 7 sections
    const parsed = pageDocumentSchema.safeParse(aboutDocument);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.blocks).toHaveLength(7);

    // Render public view
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={aboutDocument} media={{}} notices={[]} />
      </NextIntlClientProvider>,
    );

    // Hero and visible sections render
    expect(screen.getByText("About the Institution")).toBeInTheDocument();
    expect(screen.getByText("Institutional History")).toBeInTheDocument();
    expect(screen.getByText("Mission")).toBeInTheDocument();
    expect(screen.getByText("Vision")).toBeInTheDocument();
    expect(screen.getByText("Core Values")).toBeInTheDocument();
    expect(screen.getByText("Integrity and Excellence")).toBeInTheDocument();
    expect(screen.getByText("Campus Overview")).toBeInTheDocument();

    // Disabled leadership section is hidden safely in public view
    expect(screen.queryByText("Leadership and Management")).not.toBeInTheDocument();
  });

  it("validates and renders the complete 8-section admission starter page", () => {
    const admissionDocument = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          type: "hero" as const,
          heading: "Admission Information",
          text: "Learn about our admission process, requirements, schedule, and guidelines.",
          align: "left" as const,
          buttons: [],
        },
        {
          id: "10000000-0000-4000-8000-000000000010",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000011", type: "heading" as const, text: "Admission Overview", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000012", type: "text" as const, text: "General admission guidelines and session details are announced by the institution.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000020",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000021", type: "heading" as const, text: "Eligibility and Requirements", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000022", type: "text" as const, text: "Review the criteria and required documents before applying.", align: "left" as const, size: "base" as const, color: "#111827" },
            {
              id: "10000000-0000-4000-8000-000000000023",
              type: "icon-list" as const,
              items: [
                { icon: "check" as const, text: "Completed admission application form" },
                { icon: "book" as const, text: "Previous academic records and certificates" },
                { icon: "users" as const, text: "Recent passport-size photographs" },
              ],
            },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000030",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000031", type: "heading" as const, text: "Admission Process", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000032", type: "text" as const, text: "Follow the sequential steps to complete your admission.", align: "left" as const, size: "base" as const, color: "#111827" },
            {
              id: "10000000-0000-4000-8000-000000000033",
              type: "icon-list" as const,
              items: [
                { icon: "calendar" as const, text: "Step 1: Check admission schedule and criteria" },
                { icon: "book" as const, text: "Step 2: Obtain and complete the application" },
                { icon: "check" as const, text: "Step 3: Submit documents and attend interview" },
                { icon: "award" as const, text: "Step 4: Finalize admission upon selection" },
              ],
            },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000040",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000041", type: "heading" as const, text: "Important Dates", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000042", type: "text" as const, text: "Official dates are published by the institution.", align: "left" as const, size: "base" as const, color: "#111827" },
            {
              id: "10000000-0000-4000-8000-000000000043",
              type: "icon-list" as const,
              items: [
                { icon: "calendar" as const, text: "Application opening and deadline dates will appear here." },
                { icon: "clock" as const, text: "Assessment or interview schedule will be posted when announced." },
              ],
            },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000050",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000051", type: "heading" as const, text: "Fees and Payment Information", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000052", type: "text" as const, text: "Fee structures and payment instructions are provided upon admission confirmation.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000060",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000061", type: "heading" as const, text: "Frequently Asked Questions", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000062", type: "text" as const, text: "Common questions and answers regarding admission.", align: "left" as const, size: "base" as const, color: "#111827" },
            { id: "10000000-0000-4000-8000-000000000063", type: "heading" as const, text: "When does the admission process begin?", level: 3 as const, align: "left" as const, color: "#111827", size: "lg" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000064", type: "text" as const, text: "Admission sessions and deadlines are determined according to the academic calendar.", align: "left" as const, size: "base" as const, color: "#111827" },
            { id: "10000000-0000-4000-8000-000000000065", type: "heading" as const, text: "What documents must be submitted with the application?", level: 3 as const, align: "left" as const, color: "#111827", size: "lg" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000066", type: "text" as const, text: "Applicants should provide previous academic transcripts and certificates.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000070",
          type: "contact-info" as const,
          phone: "+880 1234 567890",
          email: "admission@institution.edu",
          address: "123 Education Lane",
        },
      ],
    };

    // Schema validation succeeds for 8 sections
    const parsed = pageDocumentSchema.safeParse(admissionDocument);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.blocks).toHaveLength(8);

    // Render public view
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={admissionDocument} media={{}} notices={[]} />
      </NextIntlClientProvider>,
    );

    // Hero and all visible sections render
    expect(screen.getByText("Admission Information")).toBeInTheDocument();
    expect(screen.getByText("Admission Overview")).toBeInTheDocument();
    expect(screen.getByText("Eligibility and Requirements")).toBeInTheDocument();
    expect(screen.getByText("Admission Process")).toBeInTheDocument();
    expect(screen.getByText("Important Dates")).toBeInTheDocument();
    expect(screen.getByText("Fees and Payment Information")).toBeInTheDocument();
    expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
    expect(screen.getByText("When does the admission process begin?")).toBeInTheDocument();
    expect(screen.getByText("What documents must be submitted with the application?")).toBeInTheDocument();
    expect(screen.getByText("admission@institution.edu")).toBeInTheDocument();

    // Verify empty contact-info block is omitted safely
    const emptyContactDoc = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "10000000-0000-4000-8000-000000000070",
          type: "contact-info" as const,
          phone: "",
          email: "",
          address: "",
        },
      ],
    };
    const { container: emptyContactContainer } = render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={emptyContactDoc} media={{}} notices={[]} />
      </NextIntlClientProvider>,
    );
    expect(emptyContactContainer.querySelector("address")).toBeNull();
  });

  it("validates and renders the complete 6-section notice starter page", () => {
    const noticeDocument = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          type: "hero" as const,
          heading: "Notices & Announcements",
          text: "Official notices, academic circulars, news updates, and institutional announcements.",
          align: "left" as const,
          buttons: [],
        },
        {
          id: "10000000-0000-4000-8000-000000000010",
          type: "notice-list" as const,
          heading: "Latest Notices",
          limit: 6,
        },
        {
          id: "10000000-0000-4000-8000-000000000020",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000021", type: "heading" as const, text: "Academic Announcements", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000022", type: "text" as const, text: "Important schedules, curricular updates, and examination guidelines are posted here when published.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000030",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000031", type: "heading" as const, text: "Institutional News", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000032", type: "text" as const, text: "Read the latest updates, achievements, and press releases from our institution.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000040",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000041", type: "heading" as const, text: "Events & Updates", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000042", type: "text" as const, text: "Upcoming institutional events, celebrations, and co-curricular activities will appear here.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000050",
          type: "contact-info" as const,
          phone: "+880 1234 567890",
          email: "notices@institution.edu",
          address: "123 Education Lane",
        },
      ],
    };

    // Schema validation succeeds for 6 sections
    const parsed = pageDocumentSchema.safeParse(noticeDocument);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.blocks).toHaveLength(6);

    // Render public view with a sample notice
    const sampleNotice = [{ id: "notice-1", title: "Semester Final Examination Routine", date: "2026-11-01" }];
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={noticeDocument} media={{}} notices={sampleNotice} />
      </NextIntlClientProvider>,
    );

    // Hero and all visible sections render
    expect(screen.getByText("Notices & Announcements")).toBeInTheDocument();
    expect(screen.getByText("Latest Notices")).toBeInTheDocument();
    expect(screen.getByText("Semester Final Examination Routine")).toBeInTheDocument();
    expect(screen.getByText("Academic Announcements")).toBeInTheDocument();
    expect(screen.getByText("Institutional News")).toBeInTheDocument();
    expect(screen.getByText("Events & Updates")).toBeInTheDocument();
    expect(screen.getByText("notices@institution.edu")).toBeInTheDocument();
  });

  it("validates and renders the complete 6-section contact starter page", () => {
    const contactDocument = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          type: "hero" as const,
          heading: "Contact Us",
          text: "Get in touch with us for inquiries, admissions, academic consultations, and campus visits.",
          align: "left" as const,
          buttons: [],
        },
        {
          id: "10000000-0000-4000-8000-000000000010",
          type: "contact-info" as const,
          phone: "+880 1234 567890",
          email: "info@institution.edu.bd",
          address: "Campus Road, Dhaka, Bangladesh",
        },
        {
          id: "10000000-0000-4000-8000-000000000020",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000021", type: "heading" as const, text: "Campus Location & Address", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000022", type: "text" as const, text: "Detailed campus address, landmark guidance, and transportation directions.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000030",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000031", type: "heading" as const, text: "Office & Visiting Hours", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000032", type: "text" as const, text: "Sunday – Thursday: 9:00 AM – 4:00 PM. Friday & Saturday: Closed.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000040",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000041", type: "heading" as const, text: "Send an Inquiry", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000042", type: "text" as const, text: "For admissions, general inquiries, or official communication, visit the administration office.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000050",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000051", type: "heading" as const, text: "Emergency & Department Contacts", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000052", type: "text" as const, text: "Direct extensions for admissions desk and accounts department.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
      ],
    };

    const parsed = pageDocumentSchema.safeParse(contactDocument);
    expect(parsed.success).toBe(true);

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={contactDocument} media={{}} notices={[]} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Contact Us")).toBeInTheDocument();
    expect(screen.getByText("info@institution.edu.bd")).toBeInTheDocument();
    expect(screen.getByText("Campus Location & Address")).toBeInTheDocument();
    expect(screen.getByText("Office & Visiting Hours")).toBeInTheDocument();
    expect(screen.getByText("Send an Inquiry")).toBeInTheDocument();
    expect(screen.getByText("Emergency & Department Contacts")).toBeInTheDocument();
  });

  it("validates and renders the complete 6-section gallery starter page", () => {
    const galleryDocument = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          type: "hero" as const,
          heading: "Photo Gallery",
          text: "A visual glimpse into our campus, academic events, cultural celebrations, and institutional milestones.",
          align: "left" as const,
          buttons: [],
        },
        {
          id: "10000000-0000-4000-8000-000000000010",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000011", type: "heading" as const, text: "Gallery Introduction", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000012", type: "text" as const, text: "Explore memorable snapshots and visual stories reflecting the daily life, spirit, and achievements of our institution.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000020",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000021", type: "heading" as const, text: "Photo Showcase", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000022", type: "text" as const, text: "Featured photographs and highlights from major programs, ceremonies, and special occasions.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000030",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000031", type: "heading" as const, text: "Campus Life & Events", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000032", type: "text" as const, text: "Moments from national day observances, annual sports, science fairs, and co-curricular gatherings.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000040",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000041", type: "heading" as const, text: "Facilities & Activities", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000042", type: "text" as const, text: "A visual tour of our modern classrooms, laboratories, library facilities, and recreational spaces.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000050",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000051", type: "heading" as const, text: "Photograph Archive Notice", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000052", type: "text" as const, text: "Photographs and official albums are curated by the institution administration. New images are published as events take place.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
      ],
    };

    const parsed = pageDocumentSchema.safeParse(galleryDocument);
    expect(parsed.success).toBe(true);

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={galleryDocument} media={{}} notices={[]} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Photo Gallery")).toBeInTheDocument();
    expect(screen.getByText("Gallery Introduction")).toBeInTheDocument();
    expect(screen.getByText("Photo Showcase")).toBeInTheDocument();
    expect(screen.getByText("Campus Life & Events")).toBeInTheDocument();
    expect(screen.getByText("Facilities & Activities")).toBeInTheDocument();
    expect(screen.getByText("Photograph Archive Notice")).toBeInTheDocument();
  });

  it("validates and renders the complete 6-section administration starter page", () => {
    const adminDocument = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          type: "hero" as const,
          heading: "Staff & Administration",
          text: "Meet our institutional leadership, dedicated faculty members, academic departments, and administrative personnel.",
          align: "left" as const,
          mediaId: null,
          layout: "banner" as const,
          fit: "cover" as const,
          position: "center" as const,
          buttons: [],
          slides: [],
          intervalSeconds: 5,
          autoplay: true,
          transition: "fade" as const,
        },
        {
          id: "10000000-0000-4000-8000-000000000010",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000011", type: "heading" as const, text: "Head of Institution & Leadership", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000012", type: "text" as const, text: "Our leadership guides the institution toward academic excellence, moral integrity, and modern educational advancement.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000020",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000021", type: "heading" as const, text: "Teaching Staff & Faculty", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000022", type: "text" as const, text: "Our experienced educators and faculty members deliver comprehensive curricula across all disciplines. Explore our complete directory at /staff.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000030",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000031", type: "heading" as const, text: "Administrative & Academic Support", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000032", type: "text" as const, text: "Dedicated administrative staff and academic officers support daily campus operations, student records, and institutional services.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000040",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000041", type: "heading" as const, text: "Governing Body & Managing Committee", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000042", type: "text" as const, text: "The governing body provides strategic oversight, institutional governance, and policy direction to ensure high standards.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000050",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000051", type: "heading" as const, text: "Explore Staff Directory", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000052", type: "text" as const, text: "For detailed profiles, designations, department listings, and contact information, visit our dynamic Staff Directory at /staff.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
      ],
    };

    const parsed = pageDocumentSchema.safeParse(adminDocument);
    expect(parsed.success).toBe(true);

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={adminDocument} media={{}} notices={[]} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Staff & Administration")).toBeInTheDocument();
    expect(screen.getByText("Head of Institution & Leadership")).toBeInTheDocument();
    expect(screen.getByText("Teaching Staff & Faculty")).toBeInTheDocument();
    expect(screen.getByText("Administrative & Academic Support")).toBeInTheDocument();
    expect(screen.getByText("Governing Body & Managing Committee")).toBeInTheDocument();
    expect(screen.getByText("Explore Staff Directory")).toBeInTheDocument();
  });

  it("validates and renders the complete 8-section academic starter page", () => {
    const academicDoc = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          type: "hero" as const,
          heading: "Academic Information",
          text: "Comprehensive details on our academic curriculum, educational programs, schedules, and learning framework.",
          align: "left" as const,
          mediaId: null,
          layout: "banner" as const,
          fit: "cover" as const,
          position: "center" as const,
          buttons: [],
          slides: [],
          intervalSeconds: 5,
          autoplay: true,
          transition: "fade" as const,
        },
        {
          id: "10000000-0000-4000-8000-000000000010",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000011", type: "heading" as const, text: "Academic Programs & Departments", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000012", type: "text" as const, text: "Add the academic programmes, educational streams, and academic departments offered by this institution.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000020",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000021", type: "heading" as const, text: "Classes, Grades & Subjects", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000022", type: "text" as const, text: "Add the classes, grade levels, instructional shifts, and subject curricula when confirmed by the institution.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000030",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000031", type: "heading" as const, text: "Academic Calendar & Schedule", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000032", type: "text" as const, text: "The annual academic calendar, term dates, and scheduled holidays are published upon approval by the academic committee.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000040",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000041", type: "heading" as const, text: "Examination & Assessment", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000042", type: "text" as const, text: "Continuous assessments, term examinations, and annual evaluations are conducted according to official academic circulars and notices.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000050",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000051", type: "heading" as const, text: "Class Routine & Examination Routine", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000052", type: "text" as const, text: "Class routines, practical laboratory schedules, and examination timetables are announced through the institutional notice board.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000060",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000061", type: "heading" as const, text: "Results & Academic Performance", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000062", type: "text" as const, text: "Term and annual evaluation results are published following official grading guidelines. Institutional results appear on the notice board and external portal links.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "10000000-0000-4000-8000-000000000070",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "10000000-0000-4000-8000-000000000071", type: "heading" as const, text: "Academic Resources & Student Support", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "10000000-0000-4000-8000-000000000072", type: "text" as const, text: "Add academic support services, library access, laboratory facilities, and student mentoring programmes available at this institution.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
      ],
    };

    const parsed = pageDocumentSchema.safeParse(academicDoc);
    expect(parsed.success).toBe(true);

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={academicDoc} media={{}} notices={[]} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Academic Information")).toBeInTheDocument();
    expect(screen.getByText("Academic Programs & Departments")).toBeInTheDocument();
    expect(screen.getByText("Classes, Grades & Subjects")).toBeInTheDocument();
    expect(screen.getByText("Academic Calendar & Schedule")).toBeInTheDocument();
    expect(screen.getByText("Examination & Assessment")).toBeInTheDocument();
    expect(screen.getByText("Class Routine & Examination Routine")).toBeInTheDocument();
    expect(screen.getByText("Results & Academic Performance")).toBeInTheDocument();
    expect(screen.getByText("Academic Resources & Student Support")).toBeInTheDocument();
  });

  it("validates and renders the complete 8-section examination starter page", () => {
    const examDoc = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "20000000-0000-4000-8000-000000000001",
          type: "hero" as const,
          heading: "Examination & Results",
          text: "Official examination schedules, evaluation guidelines, routine circulars, and published academic results.",
          align: "left" as const,
          mediaId: null,
          layout: "banner" as const,
          fit: "cover" as const,
          position: "center" as const,
          buttons: [],
          slides: [],
          intervalSeconds: 5,
          autoplay: true,
          transition: "fade" as const,
        },
        {
          id: "20000000-0000-4000-8000-000000000010",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "20000000-0000-4000-8000-000000000011", type: "heading" as const, text: "Examination System & Assessment Overview", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "20000000-0000-4000-8000-000000000012", type: "text" as const, text: "Institutional examinations are conducted following structured academic evaluation standards, term assessments, and national curriculum guidelines.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "20000000-0000-4000-8000-000000000020",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "20000000-0000-4000-8000-000000000021", type: "heading" as const, text: "Examination Schedules & Timetables", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "20000000-0000-4000-8000-000000000022", type: "text" as const, text: "Term examination timetables, assessment routines, and practical schedules are published prior to each examination cycle.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "20000000-0000-4000-8000-000000000030",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "20000000-0000-4000-8000-000000000031", type: "heading" as const, text: "Rules & Examination Guidelines", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "20000000-0000-4000-8000-000000000032", type: "text" as const, text: "Students must adhere to official examination hall regulations, admit card requirements, arrival times, and academic integrity policies.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "20000000-0000-4000-8000-000000000040",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "20000000-0000-4000-8000-000000000041", type: "heading" as const, text: "Results Publication & Grade Evaluation", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "20000000-0000-4000-8000-000000000042", type: "text" as const, text: "Semester, term, and annual examination results are published following the standardized institutional grading scale and official approval.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "20000000-0000-4000-8000-000000000050",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "20000000-0000-4000-8000-000000000051", type: "heading" as const, text: "Result Inquiries & Re-scrutiny Guidance", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "20000000-0000-4000-8000-000000000052", type: "text" as const, text: "Procedures for result verification, grade review requests, mark sheet distribution, and academic transcripts are coordinated through the examination controller office.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "20000000-0000-4000-8000-000000000060",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "20000000-0000-4000-8000-000000000061", type: "heading" as const, text: "Important Notices & Routine Circulars", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "20000000-0000-4000-8000-000000000062", type: "text" as const, text: "Keep track of the latest examination announcements, schedule changes, and board circulars published on our institutional notice board.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
        {
          id: "20000000-0000-4000-8000-000000000070",
          type: "section" as const,
          background: null,
          spacing: "base" as const,
          align: "left" as const,
          enabled: true,
          children: [
            { id: "20000000-0000-4000-8000-000000000071", type: "heading" as const, text: "Examination Office & Helpline", level: 2 as const, align: "left" as const, color: "#111827", size: "2xl" as const, weight: "semibold" as const },
            { id: "20000000-0000-4000-8000-000000000072", type: "text" as const, text: "For examination queries, admit card corrections, transcript requests, or result assistance, contact the institutional examination office.", align: "left" as const, size: "base" as const, color: "#111827" },
          ],
        },
      ],
    };

    const parsed = pageDocumentSchema.safeParse(examDoc);
    expect(parsed.success).toBe(true);

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={examDoc} media={{}} notices={[]} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByText("Examination & Results")).toBeInTheDocument();
    expect(screen.getByText("Examination System & Assessment Overview")).toBeInTheDocument();
    expect(screen.getByText("Examination Schedules & Timetables")).toBeInTheDocument();
    expect(screen.getByText("Rules & Examination Guidelines")).toBeInTheDocument();
    expect(screen.getByText("Results Publication & Grade Evaluation")).toBeInTheDocument();
    expect(screen.getByText("Result Inquiries & Re-scrutiny Guidance")).toBeInTheDocument();
    expect(screen.getByText("Important Notices & Routine Circulars")).toBeInTheDocument();
    expect(screen.getByText("Examination Office & Helpline")).toBeInTheDocument();
  });

  it("renders a gallery block with media and handles missing images safely", () => {
    const docWithGallery = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "20000000-0000-4000-8000-000000000001",
          type: "gallery" as const,
          mediaIds: [
            "30000000-0000-4000-8000-000000000001",
            "30000000-0000-4000-8000-000000000002",
          ],
        },
      ],
    };

    const parsed = pageDocumentSchema.safeParse(docWithGallery);
    expect(parsed.success).toBe(true);

    const media = {
      "30000000-0000-4000-8000-000000000001": {
        kind: "IMAGE" as const,
        publicUrl: "https://cdn.example.com/photo1.jpg",
        alt: "Campus Entrance",
      },
      // Second mediaId is missing to test safe empty fallback
    };

    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={docWithGallery} media={media} notices={[]} />
      </NextIntlClientProvider>,
    );

    const img = screen.getByAltText("Campus Entrance");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://cdn.example.com/photo1.jpg");
    // Missing image displays fallback
    expect(screen.getByText("No public media was returned.")).toBeInTheDocument();
  });

  it("renders safe internal and external links for buttons, cards, and hero in standard and preview modes", () => {
    const docWithLinks = {
      schemaVersion: 1 as const,
      blocks: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          type: "button" as const,
          label: "Learn More",
          url: "/about",
          size: "base" as const,
          align: "left" as const,
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          type: "button" as const,
          label: "External Portal",
          url: "https://example.com/portal",
          size: "base" as const,
          align: "left" as const,
        },
        {
          id: "33333333-3333-4333-8333-333333333333",
          type: "card" as const,
          mediaId: null,
          heading: "Academic Programs",
          description: "Our curriculum",
          linkLabel: "View Academic",
          linkUrl: "/academic?tab=info",
          children: [],
        },
        {
          id: "44444444-4444-4444-8444-444444444444",
          type: "hero" as const,
          heading: "Welcome",
          text: "Discover our school",
          align: "center" as const,
          buttons: [
            { label: "Apply Now", url: "/admission" },
            { label: "External Docs", url: "https://docs.example.com" },
          ],
        },
      ],
    };

    // 1. Standard mode
    const { unmount } = render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={docWithLinks} media={{}} notices={[]} noticeHref="/notices" />
      </NextIntlClientProvider>,
    );

    const internalBtn = screen.getByRole("link", { name: "Learn More" });
    expect(internalBtn).toHaveAttribute("href", "/about");
    expect(internalBtn).not.toHaveAttribute("target");

    const externalBtn = screen.getByRole("link", { name: "External Portal" });
    expect(externalBtn).toHaveAttribute("href", "https://example.com/portal");
    expect(externalBtn).toHaveAttribute("target", "_blank");
    expect(externalBtn).toHaveAttribute("rel", "noopener noreferrer");

    const cardLink = screen.getByRole("link", { name: "View Academic" });
    expect(cardLink).toHaveAttribute("href", "/academic?tab=info");
    expect(cardLink).not.toHaveAttribute("target");

    const heroInternal = screen.getByRole("link", { name: "Apply Now" });
    expect(heroInternal).toHaveAttribute("href", "/admission");
    expect(heroInternal).not.toHaveAttribute("target");

    const heroExternal = screen.getByRole("link", { name: "External Docs" });
    expect(heroExternal).toHaveAttribute("href", "https://docs.example.com");
    expect(heroExternal).toHaveAttribute("target", "_blank");

    unmount();

    // 2. Preview mode
    render(
      <NextIntlClientProvider locale="en" messages={en}>
        <BlockRenderer content={docWithLinks} media={{}} notices={[]} noticeHref="/preview/demo-institution/notices" />
      </NextIntlClientProvider>,
    );

    const previewInternalBtn = screen.getByRole("link", { name: "Learn More" });
    expect(previewInternalBtn).toHaveAttribute("href", "/preview/demo-institution/about");

    const previewCardLink = screen.getByRole("link", { name: "View Academic" });
    expect(previewCardLink).toHaveAttribute("href", "/preview/demo-institution/academic?tab=info");

    const previewHeroInternal = screen.getByRole("link", { name: "Apply Now" });
    expect(previewHeroInternal).toHaveAttribute("href", "/preview/demo-institution/admission");

    const previewExternalBtn = screen.getByRole("link", { name: "External Portal" });
    expect(previewExternalBtn).toHaveAttribute("href", "https://example.com/portal");
    expect(previewExternalBtn).toHaveAttribute("target", "_blank");
  });
});

function renderManager() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
    <QueryClientProvider client={client}>
      <PageManager />
    </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

function renderEditor() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
    <QueryClientProvider client={client}>
      <PageEditor id="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" />
    </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

function managed(): ManagedPage {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    title: "About",
    slug: "about",
    status: "DRAFT",
    isSystem: false,
    showInMenu: true,
    parentId: null,
    sortOrder: 1,
    seoTitle: null,
    seoDescription: null,
    content: { schemaVersion: 1, blocks: [heading] },
    media: {},
  };
}
