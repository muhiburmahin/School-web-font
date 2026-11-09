import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import en from "../messages/en.json";
import { SiteNav } from "@/components/layout/site-nav";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/i18n/copy", () => ({ useCopy: () => en.nav }));
vi.mock("@/components/layout/language-switcher", () => ({ LanguageToggle: () => <button type="button">Language</button> }));
vi.mock("@/components/layout/theme-toggle", () => ({ ThemeToggle: () => <button type="button">Theme</button> }));

describe("public navbar", () => {
  it("keeps the link bar sticky without sticking the institution name", () => {
    render(
      <SiteNav
        name="North School"
        initial="N"
        logoUrl={null}
        logoFallback=""
        links={[{ href: "/", label: "Home" }, { href: "/administration", label: "Administration and Teachers" }, { href: "/academic", label: "Academic Information" }]}
        accountHref="/login"
        signedIn={false}
        email={null}
        phone={null}
        nameBn=""
        tagline="Tagline"
        barColor="#0f3d3e"
        compact={false}
        admissionHref={null}
      />,
    );
    const navigation = screen.getByRole("navigation", { name: en.nav.menu });
    expect(navigation.className).toContain("sticky");
    expect(navigation.className).toContain("top-0");
    expect(screen.getByRole("banner").className).not.toContain("sticky");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Administration and Teachers" })).toHaveAttribute("href", "/administration");
    expect(screen.getByRole("link", { name: "Administration and Teachers" })).not.toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Academic Information" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: en.nav.menu }).querySelector("ul")?.className).toContain("flex-nowrap");
    expect(screen.getByRole("button", { name: en.nav.menu }).className).toContain("lg:hidden");
    expect(screen.getAllByText("North School")).toHaveLength(1);
  });

  it("shows a different Bengali name and keeps the whole logo inside the circle", () => {
    render(
      <SiteNav
        name="Holy Cross"
        initial="H"
        logoUrl="https://cdn.example.com/logo.png"
        logoFallback=""
        links={[{ href: "/about", label: "About College" }]}
        accountHref="/login"
        signedIn={false}
        email={null}
        phone={null}
        nameBn="হলি ক্রস"
        tagline="Tagline"
        barColor="#0f3d3e"
        compact={false}
        admissionHref={null}
      />,
    );
    expect(screen.getByText("Holy Cross")).toBeInTheDocument();
    expect(screen.getByText("হলি ক্রস")).toBeInTheDocument();
    const image = document.querySelector("header img");
    expect(image?.className).toContain("object-contain");
    expect(image?.parentElement?.className).toContain("overflow-hidden");
    expect(image?.parentElement?.className).toContain("rounded-full");
  });
});
