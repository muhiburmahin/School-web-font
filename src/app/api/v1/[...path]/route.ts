import { NextRequest, NextResponse } from "next/server";
import { readBackendOrigin } from "@/lib/api-base";

/**
 * Same-origin API gateway.
 *
 * Every institution domain serves this app, so the browser calls /api/v1/* on the school's own domain.
 * That keeps the session cookie first-party on custom domains and avoids cross-site cookie blocking.
 * The backend learns which school is asking from x-mrm-original-host, which it believes only when
 * x-mrm-proxy-secret matches. The browser never sees or sends either header.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const FORWARD_REQUEST_HEADERS = ["accept", "accept-language", "content-type", "cookie", "user-agent", "x-csrf-token", "x-request-id"];
const FORWARD_RESPONSE_HEADERS = ["content-type", "cache-control", "retry-after", "x-request-id", "content-disposition"];
const MAX_BODY_BYTES = 12 * 1024 * 1024;

function fail(status: number, message: string) {
  return NextResponse.json({ statusCode: status, message }, { status });
}

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const origin = readBackendOrigin(process.env.BACKEND_ORIGIN);
  if (!origin) return fail(503, "The API is not configured.");

  const segments = (await context.params).path;
  if (!segments.every((part) => part.length > 0 && part !== "." && part !== ".." && !/[\\/\0]/.test(part))) {
    return fail(400, "Invalid path.");
  }

  const host = request.headers.get("host");
  if (!host) return fail(400, "Missing host.");

  const method = request.method.toUpperCase();
  if (UNSAFE.has(method)) {
    // Same-origin only: the page that sent this must be served from this very host.
    const originHeader = request.headers.get("origin");
    if (originHeader) {
      let originHost: string;
      try {
        originHost = new URL(originHeader).host;
      } catch {
        return fail(403, "Origin is not allowed.");
      }
      if (originHost !== host) return fail(403, "Origin is not allowed.");
    }
    if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403, "Origin is not allowed.");
  }

  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const secret = process.env.TRUSTED_PROXY_SECRET;
  if (secret) {
    headers.set("x-mrm-proxy-secret", secret);
    headers.set("x-mrm-original-host", host);
  }
  if (process.env.NODE_ENV === "development") {
    const slug = request.headers.get("x-dev-site-slug");
    if (slug) headers.set("x-dev-site-slug", slug);
  }

  let body: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) return fail(413, "The request is too large.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${origin}/api/v1/${segments.map(encodeURIComponent).join("/")}${request.nextUrl.search}`, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return fail(502, "The service is temporarily unavailable.");
  }

  const responseHeaders = new Headers();
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  for (const cookie of upstream.headers.getSetCookie()) responseHeaders.append("set-cookie", cookie);
  responseHeaders.set("cache-control", responseHeaders.get("cache-control") ?? "no-store");

  return new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: responseHeaders });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
