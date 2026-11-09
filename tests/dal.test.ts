import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return { ...actual, cache: (fn: unknown) => fn };
});

const apiFetch = vi.hoisted(() => vi.fn());
const cookieGet = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: cookieGet,
    toString: () => "sid=session-value; csrf=csrf-value; other=no",
  }),
  headers: async () => new Headers(),
}));

vi.mock("@/lib/api-client", () => ({ apiFetch }));
vi.mock("@/lib/env.server", () => ({
  getServerEnv: () => ({
    sessionCookieName: "sid",
    csrfCookieName: "csrf",
    serverApiBaseUrl: "http://api.test",
  }),
}));

import { ApiError } from "@/lib/api-error";
import { getCurrentUser, verifySession } from "@/lib/auth/dal";

describe("verifySession", () => {
  beforeEach(() => {
    apiFetch.mockReset();
    cookieGet.mockReset();
  });

  it("is anonymous when the session cookie is missing", async () => {
    cookieGet.mockReturnValue(undefined);
    await expect(verifySession()).resolves.toEqual({ status: "anonymous" });
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("returns the user from GET /auth/me and forwards only auth cookies", async () => {
    cookieGet.mockReturnValue({ value: "session-value" });
    apiFetch.mockResolvedValue({
      id: "user-1",
      email: "admin@school.test",
      displayName: "Admin",
      roles: [],
      permissions: [],
    });
    await expect(getCurrentUser()).resolves.toMatchObject({ id: "user-1" });
    expect(apiFetch).toHaveBeenCalledWith(
      "/api/v1/auth/me",
      expect.objectContaining({
        cache: "no-store",
        cookieHeader: "sid=session-value; csrf=csrf-value",
      }),
    );
  });

  it("maps 401 to anonymous and 403 to forbidden", async () => {
    cookieGet.mockReturnValue({ value: "session-value" });
    apiFetch.mockRejectedValueOnce(new ApiError({ status: 401, kind: "unauthorized", messages: ["Unauthorized"] }));
    await expect(verifySession()).resolves.toEqual({ status: "anonymous" });
    apiFetch.mockRejectedValueOnce(new ApiError({ status: 403, kind: "forbidden", messages: ["Forbidden"] }));
    await expect(verifySession()).resolves.toEqual({ status: "forbidden" });
  });

  it("maps an unreachable API to unavailable", async () => {
    cookieGet.mockReturnValue({ value: "session-value" });
    apiFetch.mockRejectedValue(new ApiError({ status: 0, kind: "network", messages: ["down"] }));
    await expect(verifySession()).resolves.toEqual({ status: "unavailable" });
  });
});
