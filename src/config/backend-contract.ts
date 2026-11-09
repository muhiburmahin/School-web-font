/**
 * VERIFIED-FROM-SOURCE on 2026-10-22 from wen-backend.
 * Not run against a live API.
 * Cookie names are the backend defaults. A deployment can override them with
 * SESSION_COOKIE_NAME and CSRF_COOKIE_NAME. The frontend env must use the same names.
 */

export const contractReview = "VERIFIED-FROM-SOURCE — not run against a live API" as const;

export const backendContract = {
  apiPrefix: "/api/v1",
  errorEnvelope: {
    fields: ["statusCode", "message", "path", "requestId", "timestamp"] as const,
    message: "string or string[]",
    validationMessage: "property: constraint",
    serverMessage: "Internal server error",
  },
  pagination: {
    fields: ["items", "nextCursor"] as const,
    limitDefault: 20,
    limitMin: 1,
    limitMax: 50,
  },
  institutionProfile: {
    read: { method: "GET", path: "/api/v1/institution-profile" },
    update: {
      method: "PATCH",
      path: "/api/v1/institution-profile",
      access: "profile.manage",
    },
    theme: {
      fields: ["primaryColor", "secondaryColor", "actionColor", "preset", "font", "header", "footer"] as const,
      rule: "approved tokens only",
    },
  },
  media: {
    list: { method: "GET", path: "/api/v1/media" },
    detail: { method: "GET", path: "/api/v1/media/:id" },
    upload: { method: "POST", path: "/api/v1/media" },
    query: ["limit", "cursor"] as const,
  },
  externalLinks: {
    list: { method: "GET", path: "/api/v1/external-links" },
    detail: { method: "GET", path: "/api/v1/external-links/:id" },
    adminList: { method: "GET", path: "/api/v1/external-links/admin" },
    create: { method: "POST", path: "/api/v1/external-links" },
    update: { method: "PATCH", path: "/api/v1/external-links/:id" },
    remove: { method: "DELETE", path: "/api/v1/external-links/:id" },
    active: { method: "PATCH", path: "/api/v1/external-links/:id/active" },
    reorder: { method: "PATCH", path: "/api/v1/external-links/reorder" },
    permission: "external-links.manage",
    query: ["limit", "cursor", "category"] as const,
    categories: ["EMS_PORTAL", "ADMISSION", "PAYMENT", "GOVERNMENT", "SOCIAL", "OTHER"] as const,
    delete: "hard",
  },
  pages: {
    menu: { method: "GET", path: "/api/v1/pages" },
    detail: { method: "GET", path: "/api/v1/pages/:slug" },
    adminList: { method: "GET", path: "/api/v1/pages/admin" },
    adminDetail: { method: "GET", path: "/api/v1/pages/admin/:id" },
    create: { method: "POST", path: "/api/v1/pages" },
    update: { method: "PATCH", path: "/api/v1/pages/:id" },
    status: { method: "PATCH", path: "/api/v1/pages/:id/status" },
    remove: { method: "DELETE", path: "/api/v1/pages/:id" },
    reorder: { method: "PATCH", path: "/api/v1/pages/reorder" },
    permission: "pages.manage",
    statuses: ["DRAFT", "PUBLISHED"] as const,
  },
  notices: {
    list: { method: "GET", path: "/api/v1/notices" },
    adminList: { method: "GET", path: "/api/v1/notices/admin" },
    create: { method: "POST", path: "/api/v1/notices" },
    update: { method: "PATCH", path: "/api/v1/notices/:id" },
    status: { method: "PATCH", path: "/api/v1/notices/:id/status" },
    remove: { method: "DELETE", path: "/api/v1/notices/:id" },
    permission: "notices.manage",
  },
  staff: {
    list: { method: "GET", path: "/api/v1/staff" },
    adminList: { method: "GET", path: "/api/v1/staff/admin" },
    create: { method: "POST", path: "/api/v1/staff" },
    update: { method: "PATCH", path: "/api/v1/staff/:id" },
  },
  gallery: {
    list: { method: "GET", path: "/api/v1/gallery" },
    adminList: { method: "GET", path: "/api/v1/gallery/admin" },
    create: { method: "POST", path: "/api/v1/gallery" },
    update: { method: "PATCH", path: "/api/v1/gallery/:id" },
    addItem: { method: "POST", path: "/api/v1/gallery/:id/items" },
  },
  navigation: {
    list: { method: "GET", path: "/api/v1/navigation" },
    adminList: { method: "GET", path: "/api/v1/navigation/admin" },
    update: { method: "PATCH", path: "/api/v1/navigation/:id" },
  },
  contact: {
    create: { method: "POST", path: "/api/v1/contact" },
    adminList: { method: "GET", path: "/api/v1/contact" },
    adminDetail: { method: "GET", path: "/api/v1/contact/:id" },
  },
  institutionUsers: {
    create: { method: "POST", path: "/api/v1/institution-users" },
    status: { method: "PATCH", path: "/api/v1/institution-users/:userId/status" },
    permission: "users.manage",
  },
  auth: {
    login: { method: "POST", path: "/api/v1/auth/login" },
    register: { method: "POST", path: "/api/v1/auth/register" },
    logout: { method: "POST", path: "/api/v1/auth/logout" },
    me: { method: "GET", path: "/api/v1/auth/me" },
    password: { method: "POST", path: "/api/v1/auth/password" },
  },
  platform: {
    summary: { method: "GET", path: "/api/v1/platform/summary" },
    institutions: { method: "GET", path: "/api/v1/platform/institutions" },
    create: { method: "POST", path: "/api/v1/platform/institutions" },
    one: { method: "GET", path: "/api/v1/platform/institutions/:institutionId" },
    update: { method: "PATCH", path: "/api/v1/platform/institutions/:institutionId" },
    suspend: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/suspend" },
    reactivate: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/reactivate" },
    onboarding: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/onboarding" },
    domains: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/domains" },
    subdomain: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/subdomain" },
    verifyDomain: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/domains/:domainId/verify" },
    challengeDomain: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/domains/:domainId/challenge" },
    disableDomain: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/domains/:domainId/disable" },
    enableDomain: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/domains/:domainId/enable" },
    primaryDomain: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/domains/:domainId/primary" },
    admins: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/admins" },
    adminStatus: { method: "PATCH", path: "/api/v1/platform/institutions/:institutionId/admins/:userId/status" },
    audit: { method: "GET", path: "/api/v1/platform/audit" },
    repairStarter: { method: "POST", path: "/api/v1/platform/institutions/:institutionId/repair-starter" },
    read: "platform.institutions.read",
    manage: "platform.institutions.manage",
    users: "platform.users.manage",
    auditRead: "platform.audit.read",
  },
  dashboard: { summary: { method: "GET", path: "/api/v1/dashboard" } },
  health: { method: "GET", path: "/api/v1/health" },
  sessionCookieName: "sid",
  csrfCookieName: "csrf",
  csrfHeaderName: "x-csrf-token",
  csrfFailureMessage: "CSRF validation failed.",
  mfaUnavailableMessage: "Multi-factor verification is not available.",
  slugUsedMessage: "That site slug is already used.",
  emailUsedMessage: "That email is already in use.",
  hostnameInvalidMessage: "hostname is not valid.",
  hostnameUsedMessage: "That hostname is already used.",
  loginSuccess: { mfaRequired: false },
} as const;

/**
 * ASSUMPTION — confirm against a running API:
 * A browser on http://localhost:3001 stores the session cookie set by the API.
 * The backend default allowlist now includes that origin. Cookie storage was not observed.
 * A dev rewrite to BACKEND_ORIGIN does not preserve the browser Host. Shared-mode
 * institution resolution uses Host and ignores X-Forwarded-Host. That path is UNVERIFIED.
 * The client honors Retry-After when a 429 includes it. wen-backend/src does not set it.
 * The throttler package sets it for the default throttler. That header was not observed.
 */
export const assumptions = [
  "ASSUMPTION — confirm against a running API: a page on http://localhost:3001 stores the session cookie set by the API. FRONTEND_ORIGINS in the backend source includes that origin when the variable is unset outside production.",
  "ASSUMPTION — UNVERIFIED: the development rewrite of /api/v1 to BACKEND_ORIGIN does not preserve the browser Host. Shared mode resolves the institution from Host only.",
  "ASSUMPTION — confirm against a running API: institution logo hosts are not declared by the API. MEDIA_IMAGE_ORIGINS stays empty until those hosts are known. Retry-After on 429 was not observed on a response.",
] as const;
