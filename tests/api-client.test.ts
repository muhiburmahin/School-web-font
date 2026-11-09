import { describe, expect, it } from "vitest";
import { apiFetch } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("apiFetch", () => {
  it("sends the visitor host to the configured API origin", async () => {
    let seenUrl = "";
    let seenHost: string | null = null;
    await apiFetch("/api/v1/pages/home", {
      baseUrl: "http://localhost:5000",
      tenantHost: "school.example.com",
      fetchImpl: async (url, init) => {
        seenUrl = String(url);
        seenHost = new Headers(init?.headers).get("host");
        return jsonResponse(200, { title: "Home" });
      },
    });
    expect(seenUrl).toBe("http://localhost:5000/api/v1/pages/home");
    expect(seenHost).toBe("school.example.com");
  });

  it("returns the JSON body on success", async () => {
    const result = await apiFetch<{ nameEn: string }>("/api/v1/institution-profile", {
      baseUrl: "http://api.test",
      fetchImpl: async () => jsonResponse(200, { nameEn: "Sample School" }),
    });
    expect(result.nameEn).toBe("Sample School");
  });

  it("maps a validation error without echoing a cookie", async () => {
    const cookie = "sid=secret-session; csrf=secret-token";
    try {
      await apiFetch("/api/v1/auth/login", {
        method: "POST",
        baseUrl: "http://api.test",
        cookieHeader: cookie,
        csrfCookieName: "csrf",
        csrfHeaderName: "x-csrf-token",
        body: { email: "not-an-email", password: "x" },
        fetchImpl: async (_url, init) => {
          const headers = new Headers(init?.headers);
          expect(headers.get("x-csrf-token")).toBe("secret-token");
          expect(headers.get("Cookie")).toBe(cookie);
          return jsonResponse(400, {
            statusCode: 400,
            message: ["email: email must be an email"],
            path: "/api/v1/auth/login",
            requestId: "req-1",
            timestamp: "2026-10-22T00:00:00.000Z",
          });
        },
      });
      throw new Error("expected an ApiError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.kind).toBe("validation");
      expect(apiError.fieldErrors.email).toEqual(["email must be an email"]);
      expect(apiError.message).not.toContain("secret-session");
      expect(apiError.message).not.toContain("secret-token");
    }
  });

  it("marks 401 as unauthorized", async () => {
    await expect(
      apiFetch("/api/v1/auth/me", {
        baseUrl: "http://api.test",
        fetchImpl: async () =>
          jsonResponse(401, {
            statusCode: 401,
            message: "Unauthorized",
            path: "/api/v1/auth/me",
            requestId: "req-2",
            timestamp: "2026-10-22T00:00:00.000Z",
          }),
      }),
    ).rejects.toMatchObject({ status: 401, kind: "unauthorized" });
  });

  it("marks 403 as forbidden", async () => {
    await expect(
      apiFetch("/api/v1/auth/logout", {
        method: "POST",
        baseUrl: "http://api.test",
        csrfCookieName: "csrf",
        csrfHeaderName: "x-csrf-token",
        fetchImpl: async () =>
          jsonResponse(403, {
            statusCode: 403,
            message: "Forbidden",
            path: "/api/v1/auth/logout",
            requestId: "req-3",
            timestamp: "2026-10-22T00:00:00.000Z",
          }),
      }),
    ).rejects.toMatchObject({ status: 403, kind: "forbidden" });
  });
});

describe("apiFetch errors", () => {
  it("retries a CSRF failure once and does not log the token", async () => {
    document.cookie = "csrf=fresh-token";
    let calls = 0;
    await apiFetch("/api/v1/auth/logout", {
      method: "POST",
      baseUrl: "http://api.test",
      csrfCookieName: "csrf",
      csrfHeaderName: "x-csrf-token",
      fetchImpl: async (_url, init) => {
        calls += 1;
        expect(new Headers(init?.headers).get("x-csrf-token")).toBe("fresh-token");
        if (calls === 1) {
          return jsonResponse(403, {
            statusCode: 403,
            message: "CSRF validation failed.",
            path: "/api/v1/auth/logout",
            requestId: "req-4",
            timestamp: "2026-10-22T00:00:00.000Z",
          });
        }
        return new Response(null, { status: 204 });
      },
    });
    expect(calls).toBe(2);
  });

  it("does not attach cookies to a same-origin path", async () => {
    let cookie: string | null = "sent";
    await apiFetch("/api/v1/auth/me", {
      baseUrl: "/api/v1",
      cookieHeader: "sid=secret-session; csrf=secret-token",
      fetchImpl: async (_url, init) => {
        cookie = new Headers(init?.headers).get("Cookie");
        return jsonResponse(200, { id: "user-1" });
      },
    });
    expect(cookie).toBeNull();
  });

  it("records Retry-After on 429", async () => {
    await expect(
      apiFetch("/api/v1/auth/login", {
        method: "POST",
        baseUrl: "http://api.test",
        body: { email: "a@b.c", password: "x" },
        fetchImpl: async () =>
          new Response(JSON.stringify({ statusCode: 429, message: "Too many requests", path: "/api/v1/auth/login", requestId: "req-5", timestamp: "2026-10-22T00:00:00.000Z" }), {
            status: 429,
            headers: { "Content-Type": "application/json", "Retry-After": "30" },
          }),
      }),
    ).rejects.toMatchObject({ kind: "rate_limited", retryAfterSeconds: 30 });
  });
});
