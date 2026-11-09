import { afterEach, describe, expect, it, vi } from "vitest";
import { canonicalPagePath } from "@/lib/public-navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import sitemap from "@/app/sitemap";
import PublicPage, { generateMetadata as generateSlugMetadata } from "@/app/(public)/[slug]/page";
import type { PageMenu } from "@/features/pages/types";
import type { ProfileView } from "@/features/institution-profile/types";
import type { FetchResult } from "@/lib/data/result";
import { cleanup, render, screen } from "@testing-library/react";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/layout/language-switcher", () => ({ LanguageToggle: () => <button type="button">Language</button> }));
vi.mock("@/components/layout/theme-toggle", () => ({ ThemeToggle: () => <button type="button">Theme</button> }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  redirect: (url: string) => {
    redirectMock(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({
      host: "school.example.com",
      "x-forwarded-proto": "https",
    }),
}));

vi.mock("next-intl/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl/server")>();
  return {
    ...actual,
    getLocale: async () => "en",
  };
});

vi.mock("@/i18n/server-copy", () => ({
  copy: async (key: string) => {
    if (key === "nav") {
      return {
        home: "Home",
        notices: "Notices",
        staff: "Staff",
        gallery: "Gallery",
        contact: "Contact",
        admission: "Admission",
        menu: "Menu",
        login: "Sign In",
        dashboard: "Dashboard",
        skip: "Skip to content",
        unavailable: "Navigation unavailable",
        mailUs: "Email Us",
        callUs: "Call Us",
      };
    }
    if (key === "footer") {
      return {
        quickLinks: "Quick Links",
        links: "Important Links",
        copyright: "All rights reserved.",
      };
    }
    if (key === "notices") {
      return {
        title: "Notice Board",
        empty: "No published notices yet.",
        download: "Download",
        notFound: "Notice not found",
        unavailable: "Service unavailable",
        invalid: "Invalid response",
        forbidden: "Access forbidden",
      };
    }
    if (key === "pages") {
      return {
        notFound: "Page not found",
        unavailable: "Page unavailable",
        invalid: "Invalid page content",
        forbidden: "Forbidden",
      };
    }
    return {};
  },
}));

vi.mock("@/i18n/copy", () => ({
  useCopy: () => ({
    home: "Home",
    notices: "Notices",
    staff: "Staff",
    gallery: "Gallery",
    contact: "Contact",
    admission: "Admission",
    menu: "Menu",
    login: "Sign In",
    dashboard: "Dashboard",
    mailUs: "Email Us",
    callUs: "Call Us",
  }),
}));

vi.mock("@/features/external-links/api", () => ({
  getExternalLinks: async () => ({ status: "success", data: { items: [], nextCursor: null } }),
}));

vi.mock("@/features/pages/api", () => ({
  getPageMenu: async (): Promise<FetchResult<PageMenu>> => ({
    status: "success",
    data: {
      items: [
        { id: "p1", title: "Home", slug: "home", children: [] },
        { id: "p2", title: "About Us", slug: "about", children: [] },
        { id: "p3", title: "Notices", slug: "notice-board", children: [] },
        { id: "p4", title: "Admission", slug: "admission", children: [] },
      ],
    },
  }),
  getPublicPage: async (slug: string) => {
    if (slug === "about") {
      return {
        status: "success",
        data: {
          title: "About Us",
          slug: "about",
          content: { schemaVersion: 1, blocks: [] },
          media: {},
        },
      };
    }
    return { status: "not-found" };
  },
}));

vi.mock("@/lib/published-notices", () => ({
  publishedNotices: async () => [],
}));

vi.mock("@/lib/tenant-host", () => ({
  previewHref: (base: string, href: string) => (base ? `${base}${href}` : href),
  requestDevSiteSlug: async () => undefined,
  requestTenantHost: async () => "school.example.com",
  safeTenantHost: (h: string | null) => h || undefined,
  publicCanonical: (host: string, path: string) => `https://${host}${path}`,
}));

const mockProfile: ProfileView = {
  nameEn: "Ideal School",
  nameBn: "আইডিয়াল স্কুল",
  shortName: "IS",
  code: "1234",
  tagline: "Excellence in Education",
  addressEn: "Dhaka, Bangladesh",
  addressBn: "ঢাকা, বাংলাদেশ",
  officialPhone: "01700000000",
  officialEmail: "info@school.edu",
  title: "Ideal School",
  logoUrl: null,
  faviconUrl: null,
  bannerUrl: null,
  header: "default",
  footer: "default",
  font: "sans",
  primaryColor: "#0c2340",
  accentColor: "#f59e0b",
  upazila: { id: 1, nameEn: "Motijheel", nameBn: "মতিঝিল" },
  district: { id: 1, nameEn: "Dhaka", nameBn: "ঢাকা" },
};

const mockMenu: FetchResult<PageMenu> = {
  status: "success",
  data: {
    items: [
      { id: "p1", title: "Home", slug: "home", children: [] },
      { id: "p2", title: "About Us", slug: "about", children: [] },
      { id: "p3", title: "Notices", slug: "notice-board", children: [] },
      { id: "p4", title: "Admission", slug: "admission", children: [] },
    ],
  },
};

describe("Notice Board Routing Consistency", () => {
  afterEach(() => {
    cleanup();
  });

  it("canonicalPagePath maps notice-board to /notices and preserves other routes", () => {
    expect(canonicalPagePath("notice-board")).toBe("/notices");
    expect(canonicalPagePath("/notice-board")).toBe("/notices");
    expect(canonicalPagePath("home")).toBe("/");
    expect(canonicalPagePath("/home")).toBe("/");
    expect(canonicalPagePath("")).toBe("/");
    expect(canonicalPagePath("about")).toBe("/about");
    expect(canonicalPagePath("admission")).toBe("/admission");
    expect(canonicalPagePath("academic")).toBe("/academic");
    expect(canonicalPagePath("contact")).toBe("/contact");
  });

  it("Header Notice Board navigation resolves to /notices while keeping other items intact", async () => {
    const Header = await SiteHeader({
      profile: mockProfile,
      menu: mockMenu,
      menuLabels: {
        "notice-board": { labelEn: "Notice Board", labelBn: "নোটিশ বোর্ড" },
        about: { labelEn: "About", labelBn: "পরিচিতি" },
      },
      signedIn: false,
      accountHref: "/login",
    });

    render(Header);

    const noticeLink = screen.getByRole("link", { name: "Notice Board" });
    expect(noticeLink).toHaveAttribute("href", "/notices");

    const aboutLink = screen.getByRole("link", { name: "About" });
    expect(aboutLink).toHaveAttribute("href", "/about");

    const admissionLinks = screen.getAllByRole("link", { name: "Admission" });
    expect(admissionLinks.length).toBeGreaterThan(0);
    admissionLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/admission");
    });
  });

  it("Footer Notice Board navigation resolves to /notices", async () => {
    const Footer = await SiteFooter({
      profile: mockProfile,
      menu: mockMenu,
      menuLabels: {
        "notice-board": { labelEn: "Notice Board", labelBn: "নোটিশ বোর্ড" },
      },
    });

    render(Footer);

    const noticeLink = screen.getByRole("link", { name: "Notice Board" });
    expect(noticeLink).toHaveAttribute("href", "/notices");

    const aboutLink = screen.getByRole("link", { name: "About Us" });
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  it("Sitemap includes canonical /notices and does not include /notice-board", async () => {
    const items = await sitemap();
    const urls = items.map((item) => item.url);

    expect(urls).toContain("https://school.example.com/notices");
    expect(urls).not.toContain("https://school.example.com/notice-board");
    expect(urls).toContain("https://school.example.com/about");
    expect(urls).toContain("https://school.example.com/admission");
    expect(urls).toContain("https://school.example.com/");
  });

  it("Visiting legacy /notice-board triggers redirect to /notices", async () => {
    redirectMock.mockClear();

    await expect(
      PublicPage({ params: Promise.resolve({ slug: "notice-board" }) }),
    ).rejects.toThrow("REDIRECT:/notices");

    expect(redirectMock).toHaveBeenCalledWith("/notices");
  });

  it("generateMetadata for legacy /notice-board generates canonical metadata for /notices", async () => {
    const meta = await generateSlugMetadata({ params: Promise.resolve({ slug: "notice-board" }) });

    expect(meta.title).toBe("Notice Board");
    expect(meta.alternates?.canonical).toBe("https://school.example.com/notices");
  });

  it("preserves configured navigation labels and resolves notice routing to /notices", async () => {
    const FooterConfigured = await SiteFooter({
      profile: mockProfile,
      menu: mockMenu,
      menuLabels: {
        "notice-board": { labelEn: "Circulars", labelBn: "বিজ্ঞপ্তি" },
        about: { labelEn: "Institution Info", labelBn: "প্রতিষ্ঠান বিবরণ" },
      },
    });

    render(FooterConfigured);

    const noticeLink = screen.getByRole("link", { name: "Circulars" });
    expect(noticeLink).toHaveAttribute("href", "/notices");

    const aboutLink = screen.getByRole("link", { name: "Institution Info" });
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  it("keeps institution-specific navigation isolated without leaking across profiles", async () => {
    const CustomHeader = await SiteHeader({
      profile: {
        ...mockProfile,
        nameEn: "Dhaka College",
        nameBn: "ঢাকা কলেজ",
      },
      menu: {
        status: "success",
        data: {
          items: [
            { id: "p1", title: "Home", slug: "home", children: [] },
            { id: "p2", title: "College Notices", slug: "notice-board", children: [] },
          ],
        },
      },
      menuLabels: {
        "notice-board": { labelEn: "College Notices", labelBn: "কলেজ নোটিশ" },
      },
      signedIn: false,
      accountHref: "/login",
    });

    render(CustomHeader);

    const noticeLink = screen.getByRole("link", { name: "College Notices" });
    expect(noticeLink).toHaveAttribute("href", "/notices");
    expect(screen.queryByText("About Us")).not.toBeInTheDocument();
  });
});
