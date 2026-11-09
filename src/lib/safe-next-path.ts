const controlCharacters = /[\u0000-\u001f\u007f]/;

export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\")) return null;
  if (decoded.includes("\\") || decoded.includes("://") || decoded.includes(":")) return null;
  if (controlCharacters.test(decoded)) return null;
  const lower = decoded.toLowerCase();
  if (lower.includes("javascript") || lower.includes("data:") || lower.includes("vbscript")) return null;
  return decoded;
}
