import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-error";
import { mapFetchError } from "@/lib/data/result";
import { queryRetry } from "@/lib/query-client";
import { reportError, setErrorReporter } from "@/lib/report-error";

vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: (fn: unknown) => fn };
});

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", () => ({ apiFetch }));
vi.mock("@/lib/env.server", () => ({
  getServerEnv: () => ({
    serverApiBaseUrl: "http://api.test",
    sessionCookieName: "sid",
    csrfCookieName: "csrf",
  }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => ({ value: "session-value" }),
    toString: () => "sid=session-value; csrf=csrf-value; theme=no",
  }),
  headers: async () => new Headers({ host: "school.example.com" }),
}));

import { fetchAuthed } from "@/lib/data/authed";
import { fetchPublic } from "@/lib/data/public";

describe("fetch results", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    setErrorReporter(() => undefined);
  });

  it("loads public data with revalidation and no cookies", async () => {
    apiFetch.mockResolvedValue({ nameEn: "Sample" });
    await expect(fetchPublic("/api/v1/institution-profile", 60, "institution-profile")).resolves.toMatchObject({
      status: "success",
    });
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/institution-profile",
      expect.objectContaining({
        baseUrl: "http://api.test",
        revalidate: 60,
        tags: ["institution-profile"],
        tenantHost: "school.example.com",
      }),
    );
    expect(apiFetch.mock.calls[0]?.[1]).not.toHaveProperty("cookieHeader");
    expect(typeof apiFetch.mock.calls[0]?.[1].fetchImpl).toBe("function");
    expect(apiFetch.mock.calls[0]?.[1].cache).toBeUndefined();
  });

  it("loads authenticated data with no-store and only the auth cookies", async () => {
    apiFetch.mockResolvedValue({ id: "user-1" });
    await fetchAuthed("/api/v1/auth/me");
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/auth/me",
      expect.objectContaining({
        baseUrl: "http://api.test",
        cache: "no-store",
        cookieHeader: "sid=session-value; csrf=csrf-value",
        tenantHost: "school.example.com",
      }),
    );
  });

  it("maps 404 to not-found and 5xx to unavailable", () => {
    const events: unknown[] = [];
    setErrorReporter((event) => events.push(event));
    expect(mapFetchError(new ApiError({ status: 404, kind: "not_found", messages: ["hidden"] }), "public")).toEqual({
      status: "not-found",
    });
    expect(
      mapFetchError(new ApiError({ status: 503, kind: "server", messages: ["hidden"], requestId: "req-9" }), "public"),
    ).toEqual({ status: "unavailable", requestId: "req-9" });
    expect(events).toEqual([{ scope: "public", status: 503, requestId: "req-9" }]);
    expect(JSON.stringify(events)).not.toContain("hidden");
  });

  it("does not report a 404 as unavailable", () => {
    const events: unknown[] = [];
    setErrorReporter((event) => events.push(event));
    reportError({ scope: "manual" });
    mapFetchError(new ApiError({ status: 404, kind: "not_found", messages: ["missing"] }), "public");
    expect(events).toEqual([{ scope: "manual" }]);
  });
});

describe("queryRetry", () => {
  it("does not retry 401, 403, or 404", () => {
    for (const status of [401, 403, 404]) {
      const error = new ApiError({ status, kind: status === 401 ? "unauthorized" : status === 403 ? "forbidden" : "not_found", messages: ["no"] });
      expect(queryRetry(0, error)).toBe(false);
    }
  });

  it("retries network and 5xx twice", () => {
    const network = new ApiError({ status: 0, kind: "network", messages: ["down"] });
    const server = new ApiError({ status: 500, kind: "server", messages: ["down"] });
    expect(queryRetry(0, network)).toBe(true);
    expect(queryRetry(1, server)).toBe(true);
    expect(queryRetry(2, server)).toBe(false);
  });
});
