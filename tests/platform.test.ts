import { describe, expect, it } from "vitest";
import { ApiError } from "../src/lib/api-error";
import { notice, onboardingText } from "../src/features/platform/components/institution-manager";
import { platformMessages } from "../src/features/platform/messages";
import { backendContract } from "../src/config/backend-contract";
import { institutionCreateSchema, institutionFormSchema, parseCreatedInstitution, parseInstitutionList, platformView } from "../src/features/platform/schemas";

describe("platform", () => {
  it("accepts an institution form and a list payload", () => {
    expect(institutionFormSchema.safeParse({ nameBn: "স্কুল", nameEn: "School", level: "PRIMARY" }).success).toBe(true);
    expect(institutionFormSchema.safeParse({ nameBn: "", nameEn: "School" }).success).toBe(false);
    const list = parseInstitutionList({
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          status: "ACTIVE",
          createdAt: "2026-10-22T00:00:00.000Z",
          nameBn: "স্কুল",
          nameEn: "School",
          level: "PRIMARY",
        },
      ],
      nextCursor: null,
    });
    expect(list?.items[0]?.nameEn).toBe("School");
    expect("siteSlug" in institutionFormSchema.shape).toBe(false);
  });

  it("checks the create form locally and keeps the server response for availability", () => {
    const schema = institutionCreateSchema(platformMessages);
    const valid = {
      nameBn: "স্কুল",
      nameEn: "School",
      level: "PRIMARY" as const,
      siteSlug: "new-school",
      adminEmail: "admin@school.test",
      adminDisplayName: "Admin",
    };
    expect(schema.safeParse(valid).success).toBe(true);
    expect(schema.safeParse({ ...valid, siteSlug: "New-School" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, siteSlug: "admin" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, adminEmail: "not-an-email" }).success).toBe(false);
    expect(schema.safeParse({ ...valid, nameEn: "" }).success).toBe(false);
    const created = parseCreatedInstitution({
      id: "22222222-2222-4222-8222-222222222222",
      siteSlug: "new-school",
      onboardingStatus: "PENDING_SETUP",
      status: "ACTIVE",
      createdAt: "2026-10-22T00:00:00.000Z",
      nameBn: "স্কুল",
      nameEn: "School",
      level: "PRIMARY",
      domains: [],
      admins: [],
      admin: {
        id: "55555555-5555-4555-8555-555555555555",
        email: "admin@school.test",
        displayName: "Admin",
        temporaryPassword: "temporary-password",
      },
    });
    expect(created?.admin.temporaryPassword).toBe("temporary-password");
    expect(created?.siteSlug).toBe("new-school");
  });

  it("maps onboarding API errors without showing the raw server text", () => {
    const conflict = notice(new ApiError({ status: 409, kind: "conflict", messages: ["raw-server-text"] }), platformMessages);
    const invalid = notice(new ApiError({ status: 400, kind: "validation", messages: ["raw-server-text"] }), platformMessages);
    expect(conflict).toBe(platformMessages.conflict);
    expect(invalid).toBe(platformMessages.formInvalid);
    expect(notice(new ApiError({ status: 409, kind: "conflict", messages: [backendContract.slugUsedMessage] }), platformMessages)).toBe(
      platformMessages.slugConflict,
    );
    expect(notice(new ApiError({ status: 409, kind: "conflict", messages: [backendContract.emailUsedMessage] }), platformMessages)).toBe(
      platformMessages.emailConflict,
    );
    expect(notice(new ApiError({ status: 400, kind: "validation", messages: [backendContract.hostnameInvalidMessage] }), platformMessages)).toBe(
      platformMessages.domainInvalid,
    );
    expect(notice(new ApiError({ status: 409, kind: "conflict", messages: [backendContract.hostnameUsedMessage] }), platformMessages)).toBe(
      platformMessages.hostnameConflict,
    );
    expect(onboardingText("PENDING_SETUP", platformMessages)).toBe(platformMessages.onboardingPending);
    expect(onboardingText("READY", platformMessages)).toBe(platformMessages.onboardingReady);
    expect(onboardingText(undefined, platformMessages)).toBe("");
    const listed = parseInstitutionList({
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          status: "ACTIVE",
          createdAt: "2026-10-22T00:00:00.000Z",
          nameBn: "স্কুল",
          nameEn: "School",
          level: "PRIMARY",
          temporaryPassword: "secret-password",
        },
      ],
      nextCursor: null,
    });
    expect(JSON.stringify(listed)).not.toContain("secret-password");
    expect(conflict).not.toContain("raw-server-text");
    expect(invalid).not.toContain("raw-server-text");
  });

  it("hides the area without the platform read permission", () => {
    expect(platformView(["pages.manage"])).toBe("hidden");
    expect(platformView(["platform.institutions.read"])).toBe("ready");
  });

  it("keeps a backend 403 visible after the permission check", () => {
    expect(platformView(["platform.institutions.read"], "forbidden")).toBe("forbidden");
    expect(platformMessages.forbidden).toBe("You do not have access to this area.");
  });
});
