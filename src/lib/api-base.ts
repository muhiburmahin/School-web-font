const sameOriginBase = "/api/v1";
export const developmentApiBaseUrl = "http://localhost:5000";

export function isSameOriginApiBase(value: string): boolean {
  return value === sameOriginBase;
}

export function readApiBaseUrl(value: string | undefined, nodeEnv: "development" | "test" | "production"): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") {
    if (nodeEnv === "production") {
      throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production.");
    }
    return developmentApiBaseUrl;
  }
  if (trimmed === "/api/v1" || trimmed === "/api/v1/") return sameOriginBase;
  if (!isHttpUrl(trimmed)) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute http(s) URL or /api/v1.");
  }
  return trimmed.replace(/\/$/, "");
}

export function readBackendOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (trimmed === "") return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("BACKEND_ORIGIN must be an absolute http(s) origin.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("BACKEND_ORIGIN must be an absolute http(s) origin.");
  }
  if (url.username !== "" || url.password !== "") {
    throw new Error("BACKEND_ORIGIN must not include credentials.");
  }
  if (url.pathname !== "/" && url.pathname !== "") {
    throw new Error("BACKEND_ORIGIN must be an origin without a path.");
  }
  return url.origin;
}

export function apiConnectOrigin(apiBaseUrl: string): string | null {
  if (isSameOriginApiBase(apiBaseUrl)) return null;
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return null;
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
