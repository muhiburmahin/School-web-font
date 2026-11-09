import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, parseMediaOrigins, securityHeaders } from "@/lib/security-headers";

describe("security headers", () => {
  it("builds a nonce script policy and limits connect and image sources", () => {
    const csp = buildContentSecurityPolicy({
      nonce: "abc",
      isDev: false,
      apiOrigin: "https://api.example.test",
      mediaOrigins: ["https://cdn.example.test"],
    });
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src 'self' https://api.example.test");
    expect(csp).toContain("img-src 'self' data: https://cdn.example.test");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("adds the development exceptions and omits HSTS outside production", () => {
    const csp = buildContentSecurityPolicy({
      nonce: "dev",
      isDev: true,
      apiOrigin: "http://localhost:3000",
      mediaOrigins: [],
      devConnectOrigins: ["ws://localhost:3001"],
    });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain("ws://localhost:3001");
    expect(csp).not.toContain("upgrade-insecure-requests");
    const headers = securityHeaders({ production: false, csp, reportOnly: false });
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Content-Security-Policy"]).toBe(csp);
  });

  it("uses report-only and HSTS in production", () => {
    const headers = securityHeaders({
      production: true,
      csp: "default-src 'self'",
      reportOnly: true,
    });
    expect(headers["Strict-Transport-Security"]).toContain("max-age=63072000");
    expect(headers["Content-Security-Policy-Report-Only"]).toBe("default-src 'self'");
    expect(headers["Content-Security-Policy"]).toBeUndefined();
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });

  it("uses self for connect-src when the API is same-origin", () => {
    const csp = buildContentSecurityPolicy({
      nonce: "same",
      isDev: false,
      apiOrigin: null,
      mediaOrigins: [],
    });
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("localhost:3000");
  });

  it("rejects wildcard media origins", () => {
    expect(() => parseMediaOrigins("https://*.example.test")).toThrow(/wildcard/);
    expect(parseMediaOrigins("")).toEqual([]);
  });
});
