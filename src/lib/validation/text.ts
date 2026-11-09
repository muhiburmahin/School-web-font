function isForbiddenChar(code: number): boolean {
  if (code <= 31 || code === 127) return true;
  if (code >= 0x200b && code <= 0x200f) return true;
  if (code >= 0x202a && code <= 0x202e) return true;
  if (code >= 0x2066 && code <= 0x2069) return true;
  return code === 0xfeff;
}

export function normalizeSafeString(value: string, max: number, min = 1): string | null {
  const normalized = value.normalize("NFC");
  for (const char of normalized) {
    const code = char.codePointAt(0);
    if (code !== undefined && isForbiddenChar(code)) return null;
  }
  const collapsed = normalized.trim().replace(/[ \t\f\v]+/g, " ");
  if (collapsed.length < min || collapsed.length > max) return null;
  return collapsed;
}

export function truncateText(value: string, max: number): string {
  const chars = Array.from(value);
  if (chars.length <= max) return value;
  return `${chars.slice(0, max).join("")}…`;
}
