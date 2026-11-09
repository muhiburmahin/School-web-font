import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import { backendContract } from "@/config/backend-contract";
import { loginFailureMessage } from "@/features/auth/components/login-form";
import { pathAfterLogin } from "@/features/auth/session";
import type { CurrentUser } from "@/features/auth/types";
import { ApiError } from "@/lib/api-error";

const user: CurrentUser = {
  id: "user-1",
  email: "admin@school.test",
  displayName: "Admin",
  roles: ["SITE_ADMIN"],
  permissions: [],
  mustChangePassword: false,
};

describe("session routing", () => {
  it("sends a temporary password to the password page and ignores the next path", () => {
    expect(pathAfterLogin({ ...user, mustChangePassword: true }, "/admin")).toBe("/admin/password");
    expect(pathAfterLogin({ ...user, roles: ["SUPER_ADMIN"], mustChangePassword: true }, "/platform")).toBe("/platform/password");
  });

  it("uses the requested path only after the password is current", () => {
    expect(pathAfterLogin(user, "/admin/pages")).toBe("/admin/pages");
    expect(pathAfterLogin(user, "/platform")).toBe("/admin");
    expect(pathAfterLogin({ ...user, roles: ["SUPER_ADMIN"] }, null)).toBe("/platform");
    expect(pathAfterLogin({ ...user, roles: ["SUPER_ADMIN"] }, "/admin")).toBe("/platform");
    expect(pathAfterLogin({ ...user, roles: ["SUPER_ADMIN"] }, "/platform/audit")).toBe("/platform/audit");
  });

  it("shows the MFA message only for the known unavailable response", () => {
    const mfa = loginFailureMessage(
      new ApiError({ status: 403, kind: "forbidden", messages: [backendContract.mfaUnavailableMessage] }),
      en.auth,
    );
    const origin = loginFailureMessage(
      new ApiError({ status: 403, kind: "forbidden", messages: ["Origin is not allowed."] }),
      en.auth,
    );
    expect(mfa).toBe(en.auth.mfaUnavailable);
    expect(origin).toBe(en.auth.forbidden);
    expect(origin).not.toContain("Origin is not allowed.");
  });

  it("keeps a missing account on the same message as a wrong password", () => {
    const missing = loginFailureMessage(
      new ApiError({ status: 404, kind: "not_found", messages: ["Account not found"] }),
      en.auth,
    );
    const rejected = loginFailureMessage(
      new ApiError({ status: 401, kind: "unauthorized", messages: ["Invalid email or password."] }),
      en.auth,
    );
    expect(missing).toBe(en.auth.rejected);
    expect(rejected).toBe(en.auth.rejected);
    expect(missing).not.toContain("Account not found");
  });
});
