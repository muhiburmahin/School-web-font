import { describe, expect, it } from "vitest";
import { readEnv } from "@/lib/env";

describe("readEnv", () => {
  it("requires the API URL in production", () => {
    expect(() => readEnv({ NODE_ENV: "production" })).toThrow("NEXT_PUBLIC_API_BASE_URL is required in production.");
  });

  it("rejects a non-http API URL", () => {
    expect(() => readEnv({ NODE_ENV: "development", NEXT_PUBLIC_API_BASE_URL: "javascript:alert(1)" })).toThrow(
      "NEXT_PUBLIC_API_BASE_URL must be an absolute http(s) URL or /api/v1.",
    );
  });

  it("accepts the same-origin API prefix", () => {
    expect(readEnv({ NODE_ENV: "development", NEXT_PUBLIC_API_BASE_URL: "/api/v1" }).apiBaseUrl).toBe("/api/v1");
  });

  it("uses the local API and the backend cookie defaults outside production", () => {
    expect(readEnv({ NODE_ENV: "test" })).toMatchObject({
      apiBaseUrl: "http://localhost:5000",
      sessionCookieName: "sid",
      csrfCookieName: "csrf",
      csrfHeaderName: "x-csrf-token",
      apiMocks: false,
    });
  });

  it("keeps mocks off in production even when the flag is set", () => {
    expect(
      readEnv({
        NODE_ENV: "production",
        NEXT_PUBLIC_API_BASE_URL: "https://api.example.com",
        NEXT_PUBLIC_API_MOCKS: "true",
      }).apiMocks,
    ).toBe(false);
  });
});
