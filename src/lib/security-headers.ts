export interface CspInput {
  nonce: string;
  isDev: boolean;
  apiOrigin: string | null;
  mediaOrigins: readonly string[];
  devConnectOrigins?: readonly string[];
}

export interface SecurityHeaderOptions {
  production: boolean;
  csp: string;
  reportOnly: boolean;
}

const permissions = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "bluetooth=()",
  "accelerometer=()",
  "gyroscope=()",
  "magnetometer=()",
].join(", ");

export function parseMediaOrigins(value: string | undefined): string[] {
  if (!value || value.trim() === "") return [];
  const origins: string[] = [];
  for (const part of value.split(",")) {
    const raw = part.trim();
    if (!raw) continue;
    if (raw.includes("*")) {
      throw new Error("MEDIA_IMAGE_ORIGINS must not contain a wildcard host.");
    }
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new Error("MEDIA_IMAGE_ORIGINS must be a comma-separated list of absolute http(s) origins.");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("MEDIA_IMAGE_ORIGINS must use http or https.");
    }
    if (url.username !== "" || url.password !== "") {
      throw new Error("MEDIA_IMAGE_ORIGINS must not include credentials.");
    }
    origins.push(url.origin);
  }
  return origins;
}

export function buildContentSecurityPolicy(input: CspInput): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${input.nonce}'`,
    "'strict-dynamic'",
    input.isDev ? "'unsafe-eval'" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const connectSrc = ["'self'", input.apiOrigin, ...(input.isDev ? (input.devConnectOrigins ?? []) : [])]
    .filter((value): value is string => Boolean(value))
    .join(" ");
  const imgSrc = ["'self'", "data:", ...input.mediaOrigins].join(" ");
  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrc}`,
    "font-src 'self'",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
  ];
  if (!input.isDev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

export function securityHeaders(options: SecurityHeaderOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": permissions,
    "X-Frame-Options": "DENY",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
  if (options.production) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains";
  }
  const cspName = options.reportOnly ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
  headers[cspName] = options.csp;
  return headers;
}

export function applySecurityHeaders(target: Headers, options: SecurityHeaderOptions): void {
  for (const [name, value] of Object.entries(securityHeaders(options))) {
    target.set(name, value);
  }
}
