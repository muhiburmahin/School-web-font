/**
 * DEV MOCK. This file is not a data source for production.
 * It is used only when NEXT_PUBLIC_API_MOCKS=true and NODE_ENV is not production.
 */

export const mockInstitutionProfile = {
  nameEn: "Mock Institution",
  nameBn: "মক প্রতিষ্ঠান",
  level: null,
  establishedYear: null,
  addressEn: null,
  addressBn: null,
  officialEmail: null,
  officialPhone: null,
  district: null,
  upazila: null,
  logoUrl: null,
  faviconUrl: null,
};

export const mockCurrentUser = {
  id: "mock-user",
  email: "mock@example.com",
  displayName: "Mock administrator",
  roles: [] as string[],
  permissions: [] as string[],
  mustChangePassword: false,
};

export function mockResponse(path: string, method: string): { status: number; body: unknown } | null {
  if (method === "GET" && path.endsWith("/institution-profile")) {
    return { status: 200, body: mockInstitutionProfile };
  }
  if (method === "GET" && path.endsWith("/auth/me")) {
    return { status: 200, body: mockCurrentUser };
  }
  if (method === "POST" && path.endsWith("/auth/login")) {
    return { status: 200, body: { mfaRequired: false } };
  }
  if (method === "POST" && path.endsWith("/auth/logout")) {
    return { status: 204, body: null };
  }
  return null;
}
