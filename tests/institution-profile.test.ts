import { describe, expect, it } from "vitest";
import { parseInstitutionProfile, toProfileView } from "@/features/institution-profile/api";
import { profileUnavailable } from "@/features/institution-profile/types";

const profile = {
  nameEn: "Sample School",
  nameBn: "নমুনা",
  level: "SECONDARY",
  establishedYear: 1998,
  addressEn: "Main Road",
  addressBn: null,
  officialEmail: "office@school.test",
  officialPhone: null,
  district: { nameEn: "Dhaka", nameBn: "ঢাকা" },
  upazila: null,
  logoUrl: "https://cdn.example/logo.png",
  faviconUrl: "javascript:alert(1)",
};

describe("institution profile", () => {
  it("drops an unsafe logo or favicon URL", () => {
    const view = toProfileView(parseInstitutionProfile(profile));
    expect(view.logoUrl).toBe("https://cdn.example/logo.png");
    expect(view.faviconUrl).toBeNull();
    expect(view.primaryColor).toBeNull();
    expect(view).not.toHaveProperty("institutionId");
  });

  it("keeps a #RRGGBB theme color and drops other color strings", () => {
    const parsed = parseInstitutionProfile({
      ...profile,
      primaryColor: "#0F172A",
      secondaryColor: "red",
      actionColor: "javascript:alert(1)",
    });
    expect(parsed?.primaryColor).toBe("#0F172A");
    expect(parsed?.secondaryColor).toBeNull();
    expect(parsed?.actionColor).toBeNull();
  });

  it("uses the neutral fallback when the profile is missing", () => {
    expect(toProfileView(null)).toEqual(profileUnavailable);
    expect(toProfileView(null).logoUrl).toBeNull();
  });

  it("rejects a payload that is not the public profile", () => {
    expect(parseInstitutionProfile({ institutionId: "11111111-1111-4111-8111-111111111111" })).toBeNull();
  });
});
