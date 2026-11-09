import "server-only";
import http from "node:http";
import https from "node:https";
import { headers } from "next/headers";

const previewSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function requestDevSiteSlug(): Promise<string | undefined> {
  if (process.env.NODE_ENV !== "development") return undefined;
  const value = (await headers()).get("x-dev-site-slug")?.trim().toLowerCase() ?? "";
  if (!previewSlugPattern.test(value) || value.length > 80) return undefined;
  return value;
}

export function developmentPreviewRewrite(pathname: string, nodeEnv: string): { slug: string; pathname: string } | null {
  if (nodeEnv !== "development") return null;
  const match = pathname.match(/^\/preview\/([a-z0-9]+(?:-[a-z0-9]+)*)(\/.*)?$/);
  if (!match?.[1] || match[1].length > 80) return null;
  const rest = match[2] && match[2] !== "/" ? match[2] : "/";
  if (rest.includes("..") || rest.includes("//")) return null;
  return { slug: match[1], pathname: rest };
}

export function previewHref(base: string, href: string): string {
  if (!base || !href.startsWith("/") || href.startsWith("//")) return href;
  const reserved = ["/admin", "/login", "/platform", "/register", "/super-admin"];
  if (reserved.some((path) => href === path || href.startsWith(`${path}/`))) return href;
  return href === "/" ? base : `${base}${href}`;
}

export async function requestTenantHost(): Promise<string | undefined> {
  const headerList = await headers();
  return safeTenantHost(headerList.get("host"));
}

export function safeTenantHost(value: string | null): string | undefined {
  if (!value) return undefined;
  const host = value.trim().toLowerCase();
  if (host.length === 0 || host.length > 253) return undefined;
  if (host.includes("://") || host.includes("/") || host.includes("@") || host.includes(" ") || host.includes("\\")) return undefined;
  return host;
}

export function publicCanonical(host: string | undefined, path: string, forwardedProto: string | null): string | undefined {
  if (!host || !path.startsWith("/") || path.startsWith("//") || /[?#\\\s]/.test(path)) return undefined;
  const safe = safeTenantHost(host);
  if (!safe || safe !== host.trim().toLowerCase()) return undefined;
  const hostname = safe.startsWith("[") ? safe.slice(0, safe.indexOf("]") + 1) : safe.split(":")[0];
  const local = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  const proto = forwardedProto?.split(",")[0]?.trim().toLowerCase() ?? "";
  if (local) return `${proto === "https" ? "https" : "http"}://${safe}${path}`;
  if (proto === "http" || safe.includes(":")) return undefined;
  return `https://${safe}${path}`;
}

export const nodeFetch: typeof fetch = (input, init = {}) => {
  const target = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return Promise.reject(new Error("The API origin is not an http(s) URL."));
  }
  const transport = target.protocol === "https:" ? https : http;
  const headerRecord: Record<string, string> = {};
  new Headers(init.headers).forEach((value, key) => {
    headerRecord[key] = value;
  });
  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || undefined,
        path: `${target.pathname}${target.search}`,
        method: init.method,
        headers: headerRecord,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const responseHeaders = new Headers();
          for (const [key, value] of Object.entries(res.headers)) {
            if (typeof value === "string") responseHeaders.set(key, value);
            else if (Array.isArray(value)) value.forEach((item) => responseHeaders.append(key, item));
          }
          resolve(new Response(Buffer.concat(chunks), { status: res.statusCode ?? 500, headers: responseHeaders }));
        });
      },
    );
    const abort = () => req.destroy(new DOMException("The request was cancelled.", "AbortError"));
    init.signal?.addEventListener("abort", abort, { once: true });
    req.on("error", reject);
    if (typeof init.body === "string") req.write(init.body);
    req.end();
  });
};
