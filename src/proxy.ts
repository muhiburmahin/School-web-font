import { NextResponse, type NextRequest } from "next/server";
import { backendContract } from "@/config/backend-contract";
import { safeNextPath } from "@/lib/safe-next-path";
import { apiConnectOrigin, developmentApiBaseUrl } from "@/lib/api-base";
import { applySecurityHeaders, buildContentSecurityPolicy, parseMediaOrigins } from "@/lib/security-headers";
import { developmentPreviewRewrite } from "@/lib/tenant-host";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const apiOrigin = apiConnectOrigin(process.env.NEXT_PUBLIC_API_BASE_URL || developmentApiBaseUrl);
  const csp = buildContentSecurityPolicy({
    nonce,
    isDev,
    apiOrigin,
    mediaOrigins: mediaOriginsFromEnv(),
    devConnectOrigins: ["ws://localhost:3000", "ws://127.0.0.1:3000"],
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("Content-Security-Policy", csp);

  const preview = developmentPreviewRewrite(request.nextUrl.pathname, process.env.NODE_ENV ?? "");
  if (preview) requestHeaders.set("x-dev-site-slug", preview.slug);
  const response = preview
    ? NextResponse.rewrite(new URL(preview.pathname + request.nextUrl.search, request.url), { request: { headers: requestHeaders } })
    : adminRedirect(request) ?? NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(response.headers, {
    production: process.env.NODE_ENV === "production",
    csp,
    reportOnly: process.env.CSP_REPORT_ONLY === "true",
  });
  return response;
}

function adminRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const protectedPath =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/platform" ||
    pathname.startsWith("/platform/") ||
    pathname === "/super-admin" ||
    pathname.startsWith("/super-admin/");
  if (!protectedPath) return null;
  const cookieName = process.env.SESSION_COOKIE_NAME || backendContract.sessionCookieName;
  const hasSession =
    request.cookies.get(cookieName)?.value ||
    request.cookies.get("mrm_sid")?.value ||
    request.cookies.get("sid")?.value;
  if (hasSession) return null;
  const next = safeNextPath(pathname);
  const login = new URL("/login", request.url);
  if (next) login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

function mediaOriginsFromEnv(): string[] {
  try {
    return parseMediaOrigins(process.env.MEDIA_IMAGE_ORIGINS);
  } catch {
    return [];
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
