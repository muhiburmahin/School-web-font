import { backendContract } from "@/config/backend-contract";
import { mockResponse } from "@/mocks/dev-fixtures";
import { isSameOriginApiBase } from "./api-base";
import { apiErrorFromBody, ApiError } from "./api-error";
import { browserCookieSource, readCsrfToken } from "./csrf";
import { getPublicEnv } from "./env";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const maxResponseBytes = 1_048_576;

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  cookieHeader?: string | null;
  timeoutMs?: number;
  signal?: AbortSignal;
  revalidate?: number;
  tags?: readonly string[];
  cache?: "no-store";
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  tenantHost?: string;
  devSiteSlug?: string;
  csrfCookieName?: string;
  csrfHeaderName?: string;
  csrfRetried?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  if (mocksEnabled() && !options.fetchImpl) {
    const mocked = mockResponse(path, method);
    if (mocked) {
      if (mocked.status === 204) return undefined as T;
      return mocked.body as T;
    }
  }

  const baseUrl = options.baseUrl ?? getPublicEnv().apiBaseUrl;
  const target = requestTarget(path, baseUrl);
  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (options.body !== undefined) headers.set("Content-Type", "application/json");
  if (options.tenantHost) {
    const proxySecret = typeof window === "undefined" ? process.env.TRUSTED_PROXY_SECRET : undefined;
    if (proxySecret) {
      // Separate deployments: keep our own Host so the platform router still finds the backend,
      // and tell the backend which school this is under the shared secret.
      headers.set("x-mrm-proxy-secret", proxySecret);
      headers.set("x-mrm-original-host", options.tenantHost);
    } else if (options.fetchImpl) {
      headers.set("host", options.tenantHost);
    }
  }
  if (options.devSiteSlug && process.env.NODE_ENV === "development") headers.set("x-dev-site-slug", options.devSiteSlug);
  if (options.cookieHeader && canAttachCookies(target, baseUrl)) {
    headers.set("Cookie", options.cookieHeader);
  }

  if (unsafeMethods.has(method)) {
    const csrfCookieName = options.csrfCookieName ?? getPublicEnv().csrfCookieName;
    const csrfHeaderName = options.csrfHeaderName ?? getPublicEnv().csrfHeaderName;
    const source = options.cookieHeader ?? browserCookieSource();
    const token = readCsrfToken(source, csrfCookieName);
    if (token) headers.set(csrfHeaderName, token);
  }

  const timeout = AbortSignal.timeout(options.timeoutMs ?? 10_000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  const fetchImpl = options.fetchImpl ?? fetch;
  let response: Response;
  try {
    response = await fetchImpl(target, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: "include",
      redirect: "error",
      signal,
      cache: options.cache,
      ...nextOptions(options),
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw new ApiError({ status: 0, kind: "network", messages: ["The request was cancelled."] });
    }
    if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new ApiError({ status: 0, kind: "timeout", messages: ["The request timed out."] });
    }
    throw new ApiError({
      status: 0,
      kind: "network",
      messages: ["The service is temporarily unavailable."],
    });
  }

  if (response.status === 204) return undefined as T;

  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) {
    throw new ApiError({ status: response.status, kind: "client", messages: ["The response was too large."] });
  }

  const text = await response.text();
  if (text.length > maxResponseBytes) {
    throw new ApiError({ status: response.status, kind: "client", messages: ["The response was too large."] });
  }

  const payload = text.length === 0 ? null : parseJsonBody(response, text);
  if (!response.ok) {
    const error = apiErrorFromBody(response.status, payload, response.headers.get("retry-after"));
    if (shouldRetryCsrf(method, options, error)) {
      return apiFetch<T>(path, { ...options, csrfRetried: true });
    }
    throw error;
  }
  return payload as T;
}

function shouldRetryCsrf(method: string, options: ApiFetchOptions, error: ApiError): boolean {
  return (
    unsafeMethods.has(method) &&
    !options.csrfRetried &&
    options.cookieHeader === undefined &&
    error.status === 403 &&
    error.messages.includes(backendContract.csrfFailureMessage)
  );
}

function parseJsonBody(response: Response, text: string): unknown {
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json") && !type.includes("+json")) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function requestTarget(path: string, baseUrl: string): string {
  if (isSameOriginApiBase(baseUrl)) return path;
  return new URL(path, `${baseUrl.replace(/\/$/, "")}/`).toString();
}

function canAttachCookies(target: string, baseUrl: string): boolean {
  if (isSameOriginApiBase(baseUrl) || target.startsWith("/")) return false;
  return new URL(target).origin === new URL(baseUrl).origin;
}

function nextOptions(options: ApiFetchOptions): { next?: { revalidate?: number; tags?: string[] } } {
  if (options.fetchImpl || options.cache === "no-store") return {};
  if (options.revalidate === undefined && !options.tags?.length) return {};
  return {
    next: {
      ...(options.revalidate === undefined ? {} : { revalidate: options.revalidate }),
      ...(options.tags?.length ? { tags: [...options.tags] } : {}),
    },
  };
}

function mocksEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_API_MOCKS === "true";
}
