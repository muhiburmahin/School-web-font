const maxUrlLength = 2048;

function hasControl(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

export function safeHttpUrl(value: string | null | undefined): string | null {
  return safeUrl(value, new Set(["http:", "https:"]));
}

export function safeHttpsUrl(value: string | null | undefined): string | null {
  return safeUrl(value, new Set(["https:"]));
}

function safeUrl(value: string | null | undefined, allowed: Set<string>): string | null {
  if (!value || value.length > maxUrlLength || value !== value.trim()) return null;
  const lower = value.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:") || lower.startsWith("file:")) {
    return null;
  }
  try {
    const url = new URL(value);
    if (!allowed.has(url.protocol)) return null;
    if (url.username !== "" || url.password !== "" || url.hostname === "") return null;
    return value;
  } catch {
    return null;
  }
}

export function safeCmsUrl(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string" || value.length > maxUrlLength || value !== value.trim()) return null;
  if (hasControl(value) || value.includes("\\")) return null;

  if (value.startsWith("https://")) {
    return safeHttpsUrl(value);
  }

  return safeCmsInternalPath(value);
}

export function safeCmsInternalPath(value: string | null | undefined): string | null {
  if (!value || typeof value !== "string" || value.length > maxUrlLength || value !== value.trim()) return null;
  if (hasControl(value) || value.includes("\\")) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;

  try {
    decodeURI(value);
  } catch {
    return null;
  }

  const pathPart = value.split(/[?#]/, 1)[0] ?? "";
  let decodedPathPart: string;
  try {
    decodedPathPart = decodeURIComponent(pathPart);
  } catch {
    return null;
  }

  if (decodedPathPart.includes("\\") || decodedPathPart.startsWith("//") || decodedPathPart.startsWith("/\\")) {
    return null;
  }
  if (hasControl(decodedPathPart)) return null;

  const rawSegments = pathPart.split("/");
  for (const segment of rawSegments) {
    const lower = segment.toLowerCase();
    if (segment === "." || segment === ".." || lower === "%2e" || lower === "%2e%2e") {
      return null;
    }
  }

  const decodedSegments = decodedPathPart.split("/");
  for (const segment of decodedSegments) {
    const lower = segment.toLowerCase();
    if (segment === "." || segment === ".." || lower === "%2e" || lower === "%2e%2e") {
      return null;
    }
  }

  const lowerDecoded = decodedPathPart.toLowerCase();
  if (
    lowerDecoded.includes("javascript:") ||
    lowerDecoded.includes("data:") ||
    lowerDecoded.includes("vbscript:") ||
    lowerDecoded.includes("file:") ||
    decodedPathPart === "/preview" ||
    decodedPathPart.startsWith("/preview/")
  ) {
    return null;
  }

  try {
    const parsed = new URL(value, "http://localhost");
    if (parsed.origin !== "http://localhost" || parsed.username !== "" || parsed.password !== "") {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function previewBaseFromNoticeHref(noticeHref?: string): string {
  if (!noticeHref) return "";
  return noticeHref.endsWith("/notices") ? noticeHref.slice(0, -"/notices".length) : "";
}

export function resolveCmsHref(href: string, previewBase?: string): string {
  if (!href.startsWith("/")) return href;
  if (!previewBase) return href;
  if (href === previewBase || href.startsWith(`${previewBase}/`)) return href;

  const reserved = ["/admin", "/login", "/platform", "/register", "/super-admin"];
  if (reserved.some((path) => href === path || href.startsWith(`${path}/`))) {
    return href;
  }

  if (href === "/") return previewBase;
  if (href.startsWith("/?") || href.startsWith("/#")) {
    return `${previewBase}${href.slice(1)}`;
  }

  return `${previewBase}${href}`;
}
