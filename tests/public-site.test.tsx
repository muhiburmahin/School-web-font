import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
const getPublicPage = vi.hoisted(() => vi.fn());
const getInstitutionProfile = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/features/pages/api", () => ({ getPublicPage }));
vi.mock("@/features/institution-profile/api", async () => {
  const actual = await vi.importActual<typeof import("@/features/institution-profile/api")>("@/features/institution-profile/api");
  return { ...actual, getInstitutionProfile };
});
vi.mock("@/features/pages/components/block-renderer", () => ({
  BlockRenderer: ({ content }: { content: { blocks: Array<{ text?: string }> } }) => <div>{content.blocks[0]?.text}</div>,
}));
vi.mock("@/i18n/server-copy", () => ({
  copy: async (section: string) =>
    section === "pages"
      ? { notFound: "Page missing", unavailable: "Page unavailable", invalid: "Invalid page", forbidden: "Forbidden" }
      : { notFound: "School missing", unavailable: "School unavailable", established: "Established" },
}));
vi.mock("next-intl/server", () => ({ getLocale: async () => "en" }));

import HomePage from "@/app/(public)/page";
import PublicPage from "@/app/(public)/[slug]/page";

const published = {
  status: "success" as const,
  data: {
    title: "About this school",
    seoTitle: "About",
    seoDescription: null,
    content: { blocks: [{ text: "Published copy" }] },
    media: [],
  },
};

describe("public institution pages", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    notFound.mockClear();
    getPublicPage.mockReset();
    getInstitutionProfile.mockReset();
  });

  it("renders only the published page document", async () => {
    getPublicPage.mockResolvedValue(published);
    render(await PublicPage({ params: Promise.resolve({ slug: "about" }) }));
    expect(screen.getByRole("heading", { name: "About this school" })).toBeInTheDocument();
    expect(screen.getByText("Published copy")).toBeInTheDocument();
    expect(screen.queryByText("Other School")).not.toBeInTheDocument();
  });

  it("treats a missing page as not found", async () => {
    getPublicPage.mockResolvedValue({ status: "not-found" });
    await expect(PublicPage({ params: Promise.resolve({ slug: "about" }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("shows a safe notice when the page API fails", async () => {
    getPublicPage.mockResolvedValue({ status: "unavailable", requestId: "req-9" });
    render(await PublicPage({ params: Promise.resolve({ slug: "about" }) }));
    expect(screen.getByRole("alert")).toHaveTextContent("Page unavailable");
    expect(screen.queryByText("req-9")).not.toBeInTheDocument();
    expect(screen.queryByText(/stack|Internal server error/i)).not.toBeInTheDocument();
  });

  it("shows the same institution's missing-school notice when the host has no site", async () => {
    getPublicPage.mockResolvedValue({ status: "not-found" });
    getInstitutionProfile.mockResolvedValue({ status: "not-found" });
    render(await HomePage());
    expect(screen.getByText("Institution")).toBeInTheDocument();
    expect(screen.getByText("School missing")).toBeInTheDocument();
    expect(screen.queryByText("Other School")).not.toBeInTheDocument();
  });
});
