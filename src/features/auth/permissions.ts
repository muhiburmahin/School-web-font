export function hasPermission(
  user: { permissions?: readonly string[]; roles?: readonly string[] } | null | undefined,
  requiredPermission?: string,
): boolean {
  if (!user) return false;
  const roles = user.roles ?? [];
  const permissions = user.permissions ?? [];

  // Super admin, site admin, and institution owner have unrestricted access
  if (
    roles.includes('SUPER_ADMIN') ||
    roles.includes('SITE_ADMIN') ||
    roles.includes('INSTITUTION_OWNER') ||
    roles.includes('INSTITUTION_ADMIN')
  ) {
    return true;
  }

  // Wildcard permissions
  if (
    permissions.includes('*') ||
    permissions.includes('institution:*') ||
    permissions.includes('platform:*')
  ) {
    return true;
  }

  if (!requiredPermission) return true;

  // Normalize dot-notation and colon-notation (e.g. pages.manage <=> pages:manage)
  const normalizedReq = requiredPermission.replace(/\./g, ':');
  return permissions.some(
    (p) => p === requiredPermission || p.replace(/\./g, ':') === normalizedReq,
  );
}

