import type { CurrentUser } from "./types";

export function pathAfterLogin(user: CurrentUser, explicitNext: string | null): string {
  const platformOnly = (user.roles.includes("SUPER_ADMIN") || user.roles.includes("PLATFORM_SUPPORT")) && !user.roles.includes("SITE_ADMIN");
  if (user.mustChangePassword) return platformOnly ? "/platform/password" : "/admin/password";
  if (platformOnly) return platformDestination(explicitNext);
  if (explicitNext && !isPlatformPath(explicitNext)) return explicitNext;
  return "/admin";
}

function isPlatformPath(path: string): boolean {
  return path === "/platform" || path.startsWith("/platform/") || path === "/super-admin" || path.startsWith("/super-admin/");
}

function platformDestination(path: string | null): string {
  if (path === "/platform" || path?.startsWith("/platform/")) return path;
  return "/platform";
}

export type { CurrentUser, SessionResult } from "./types";

export function parseCurrentUser(value: unknown): CurrentUser | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const u = (row.user && typeof row.user === "object" ? row.user : row) as Record<string, unknown>;
  const id = (u.id || u.userId || row.id) as string | undefined;
  const email = (u.email || row.email) as string | undefined;
  const displayName = (u.displayName || u.fullName || row.displayName || row.fullName || email) as string | undefined;

  if (typeof id !== "string" || typeof email !== "string" || typeof displayName !== "string") {
    return null;
  }
  return {
    id,
    email,
    displayName,
    roles: stringList(u.roles || row.roles),
    permissions: stringList(u.permissions || row.permissions),
    mustChangePassword: u.mustChangePassword === true || row.mustChangePassword === true,
  };
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
