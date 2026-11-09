export function authCookieHeader(cookieHeader: string, sessionName: string, csrfName: string): string {
  const kept: string[] = [];
  const allowed = new Set([sessionName, csrfName, 'mrm_sid', 'mrm_csrf', 'sid', 'csrf']);
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const separator = trimmed.indexOf('=');
    if (separator <= 0) continue;
    const name = trimmed.slice(0, separator);
    if (allowed.has(name)) kept.push(trimmed);
  }
  return kept.join('; ');
}
