import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "School.Example.com:3000" }),
}));

import { developmentPreviewRewrite, previewHref, publicCanonical, requestTenantHost, safeTenantHost } from "@/lib/tenant-host";

describe("tenant host", () => {
  it("keeps a canonical host and drops a malformed one", () => {
    expect(safeTenantHost(" School.Example.com ")).toBe("school.example.com");
    expect(safeTenantHost("https://school.example.com/path")).toBeUndefined();
    expect(safeTenantHost("user@school.example.com")).toBeUndefined();
    expect(safeTenantHost("school.example.com/about")).toBeUndefined();
    expect(safeTenantHost("")).toBeUndefined();
    expect(safeTenantHost(null)).toBeUndefined();
  });

  it("reads the request host header", async () => {
    await expect(requestTenantHost()).resolves.toBe("school.example.com:3000");
  });

  it("builds a canonical URL only for a safe host and path", () => {
    expect(publicCanonical("school.example.com", "/notice-board", "https")).toBe("https://school.example.com/notice-board");
    expect(publicCanonical("localhost:3000", "/", null)).toBe("http://localhost:3000/");
    expect(publicCanonical("school.example.com", "/about", "http")).toBeUndefined();
    expect(publicCanonical("school.example.com:3000", "/about", "https")).toBeUndefined();
    expect(publicCanonical("https://school.example.com", "/about", "https")).toBeUndefined();
    expect(developmentPreviewRewrite("/preview/north-school/about", "development")).toEqual({ slug: "north-school", pathname: "/about" });
    expect(developmentPreviewRewrite("/preview/north-school", "development")).toEqual({ slug: "north-school", pathname: "/" });
    expect(developmentPreviewRewrite("/preview/north-school/about", "production")).toBeNull();
    expect(developmentPreviewRewrite("/preview/Not Valid", "development")).toBeNull();
    expect(previewHref("/preview/north-school", "/about")).toBe("/preview/north-school/about");
    expect(previewHref("/preview/north-school", "/admin/pages")).toBe("/admin/pages");
    expect(previewHref("", "/about")).toBe("/about");
    expect(publicCanonical("school.example.com", "//evil.example", "https")).toBeUndefined();
    expect(publicCanonical("school.example.com", "/about?x=1", "https")).toBeUndefined();
  });
});