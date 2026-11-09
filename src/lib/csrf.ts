export function readCsrfToken(cookieSource: string | null | undefined, cookieName: string): string | null {
  if (!cookieSource) return null;
  const targetNames = [cookieName, "mrm_csrf", "csrf"].filter(Boolean);
  for (const part of cookieSource.split(";")) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const name = trimmed.slice(0, separator);
    if (!targetNames.includes(name)) continue;
    try {
      const value = decodeURIComponent(trimmed.slice(separator + 1));
      if (value.length > 0) return value;
    } catch {
      continue;
    }
  }
  return null;
}

export function browserCookieSource(): string {
  if (typeof document === "undefined") return "";
  return document.cookie;
}
