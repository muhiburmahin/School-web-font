import { describe, expect, it } from "vitest";
import { parseThemeHex } from "@/lib/validation/color";
import { parseRecordId, parseSlug } from "@/lib/validation/identifiers";
import { parseCategory, parseCursor, parseLimit } from "@/lib/validation/query";
import { normalizeSafeString } from "@/lib/validation/text";
import { previewBaseFromNoticeHref, resolveCmsHref, safeCmsInternalPath, safeCmsUrl, safeHttpUrl, safeHttpsUrl } from "@/lib/validation/url";

describe("validation", () => {
  it("normalizes NFC text and rejects control or bidi characters", () => {
    expect(normalizeSafeString(" Cafe\u0301 ", 20)).toBe("Café");
    expect(normalizeSafeString("hello\u0000", 20)).toBeNull();
    expect(normalizeSafeString("hello\u202E", 20)).toBeNull();
    expect(normalizeSafeString("hello\u200B", 20)).toBeNull();
    expect(normalizeSafeString("   ", 20)).toBeNull();
  });

  it("accepts a slug and an id, and rejects path tricks", () => {
    expect(parseSlug("school-news")).toBe("school-news");
    expect(parseSlug("../etc")).toBeNull();
    expect(parseSlug("Has Space")).toBeNull();
    expect(parseRecordId("11111111-1111-4111-8111-111111111111")).toBe("11111111-1111-4111-8111-111111111111");
    expect(parseRecordId("not-an-id")).toBeNull();
  });

  it("defaults a bad limit and drops a bad cursor", () => {
    expect(parseLimit(undefined)).toBe(20);
    expect(parseLimit("10")).toBe(10);
    expect(parseLimit("51")).toBe(20);
    expect(parseLimit("0")).toBe(20);
    expect(parseCursor("abc_DEF-1")).toBe("abc_DEF-1");
    expect(parseCursor("bad cursor")).toBeNull();
  });

  it("accepts only the backend link categories", () => {
    expect(parseCategory(undefined)).toEqual({ ok: true, category: null });
    expect(parseCategory("ADMISSION")).toEqual({ ok: true, category: "ADMISSION" });
    expect(parseCategory("NOT_A_CATEGORY")).toEqual({ ok: false });
  });

  it("accepts only #RRGGBB colors", () => {
    expect(parseThemeHex("#0F172A")).toBe("#0F172A");
    expect(parseThemeHex("red")).toBeNull();
    expect(parseThemeHex("#ABC")).toBeNull();
    expect(parseThemeHex("url(#fff)")).toBeNull();
  });

  it("rejects unsafe URL schemes and credentials", () => {
    expect(safeHttpUrl("https://school.example/a")).toBe("https://school.example/a");
    expect(safeHttpUrl("http://school.example/a")).toBe("http://school.example/a");
    expect(safeHttpsUrl("http://school.example/a")).toBeNull();
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,hi",
      "vbscript:msg",
      "file:///etc/passwd",
      "https://user:pass@school.example",
      "https://school.example/" + "a".repeat(3000),
    ]) {
      expect(safeHttpUrl(value)).toBeNull();
    }
  });

  it("accepts safe CMS URLs (internal paths and https) and rejects unsafe inputs", () => {
    // Valid cases
    expect(safeCmsUrl("/")).toBe("/");
    expect(safeCmsUrl("/about")).toBe("/about");
    expect(safeCmsUrl("/admission")).toBe("/admission");
    expect(safeCmsUrl("/contact?tab=info#section")).toBe("/contact?tab=info#section");
    expect(safeCmsUrl("/?tab=1")).toBe("/?tab=1");
    expect(safeCmsUrl("https://example.com")).toBe("https://example.com");
    expect(safeCmsUrl("https://example.com/portal?ref=1#top")).toBe("https://example.com/portal?ref=1#top");

    // Invalid cases
    const bad = [
      "http://example.com",
      "//evil.com",
      "/\\evil.com",
      "\\evil.com",
      "/path\\evil",
      "/..",
      "/../admin",
      "/about/..",
      "/about/../admin",
      "/%2e%2e/admin",
      "/%252e%252e/admin",
      "/preview/other-tenant",
      "/preview",
      "javascript:alert(1)",
      "/javascript:alert(1)",
      "data:text/html,test",
      "file:///etc/passwd",
      "vbscript:test",
      "https://user:pass@example.com",
      "/bad%E0%A4path",
      "   /about   ",
      "/about\u0000",
      "",
      null,
      undefined,
    ];
    for (const item of bad) {
      expect(safeCmsUrl(item)).toBeNull();
      expect(safeCmsInternalPath(item)).toBeNull();
    }
  });

  it("extracts preview base and resolves internal CMS URLs correctly", () => {
    expect(previewBaseFromNoticeHref("/notices")).toBe("");
    expect(previewBaseFromNoticeHref("/preview/acme/notices")).toBe("/preview/acme");
    expect(previewBaseFromNoticeHref(undefined)).toBe("");
    expect(previewBaseFromNoticeHref("/other-path")).toBe("");

    // Standard mode (no preview base)
    expect(resolveCmsHref("/about", "")).toBe("/about");
    expect(resolveCmsHref("/", "")).toBe("/");
    expect(resolveCmsHref("/contact?tab=info#section", "")).toBe("/contact?tab=info#section");
    expect(resolveCmsHref("https://example.com", "")).toBe("https://example.com");

    // Preview mode
    expect(resolveCmsHref("/about", "/preview/acme")).toBe("/preview/acme/about");
    expect(resolveCmsHref("/", "/preview/acme")).toBe("/preview/acme");
    expect(resolveCmsHref("/?tab=info", "/preview/acme")).toBe("/preview/acme?tab=info");
    expect(resolveCmsHref("/#faq", "/preview/acme")).toBe("/preview/acme#faq");
    expect(resolveCmsHref("/contact?tab=info#section", "/preview/acme")).toBe("/preview/acme/contact?tab=info#section");
    expect(resolveCmsHref("/notices", "/preview/acme")).toBe("/preview/acme/notices");

    // Reserved routes should not be prefixed with previewBase
    expect(resolveCmsHref("/admin", "/preview/acme")).toBe("/admin");
    expect(resolveCmsHref("/login", "/preview/acme")).toBe("/login");
    expect(resolveCmsHref("/platform", "/preview/acme")).toBe("/platform");

    // External URLs should never be rewritten
    expect(resolveCmsHref("https://example.com", "/preview/acme")).toBe("https://example.com");
  });
});
