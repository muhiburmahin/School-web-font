import { cache } from "react";
import { backendContract } from "@/config/backend-contract";
import { fetchPublic } from "@/lib/data/public";
import { safeHttpUrl } from "@/lib/safe-url";
import { publicThemeColor } from "./schemas";
import {
  profileUnavailable,
  type ProfileView,
  type PublicInstitutionProfile,
  type PublicPlaceName,
} from "./types";

export const institutionProfileKeys = {
  all: ["institution-profile"] as const,
};

const profileTag = "institution-profile";

export const getInstitutionProfile = cache(async () => {
  const result = await fetchPublic(backendContract.institutionProfile.read.path, 60, profileTag);
  if (result.status !== "success") return result;
  const profile = parseInstitutionProfile(result.data);
  if (!profile) return { status: "invalid-response" as const };
  return { status: "success" as const, data: profile };
});

export function parseInstitutionProfile(value: unknown): PublicInstitutionProfile | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.nameEn !== "string" || typeof row.nameBn !== "string") return null;
  return {
    nameEn: row.nameEn,
    nameBn: row.nameBn,
    level: optionalString(row.level),
    establishedYear: optionalYear(row.establishedYear),
    addressEn: optionalString(row.addressEn),
    addressBn: optionalString(row.addressBn),
    officialEmail: optionalString(row.officialEmail),
    officialPhone: optionalString(row.officialPhone),
    district: optionalPlace(row.district),
    upazila: optionalPlace(row.upazila),
    logoUrl: optionalString(row.logoUrl),
    faviconUrl: optionalString(row.faviconUrl),
    primaryColor: publicThemeColor(row.primaryColor),
    secondaryColor: publicThemeColor(row.secondaryColor),
    actionColor: publicThemeColor(row.actionColor),
    font: choice(row.font, ["sans", "serif", "bangla"], "sans"),
    header: choice(row.header, ["band", "compact"], "band"),
    footer: choice(row.footer, ["columns", "simple"], "columns"),
    preset: choice(row.preset, ["general", "school", "college", "madrasah", "technical", "coaching", "custom"], "custom"),
  };
}

function choice<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

export function toProfileView(profile: PublicInstitutionProfile | null): ProfileView {
  if (!profile) return profileUnavailable;
  const nameEn = profile.nameEn.trim();
  return {
    ...profile,
    nameEn: nameEn || profileUnavailable.nameEn,
    logoUrl: safeHttpUrl(profile.logoUrl),
    faviconUrl: safeHttpUrl(profile.faviconUrl),
    primaryColor: publicThemeColor(profile.primaryColor),
    secondaryColor: publicThemeColor(profile.secondaryColor),
    actionColor: publicThemeColor(profile.actionColor),
    title: nameEn || profileUnavailable.title,
  };
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function optionalYear(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function optionalPlace(value: unknown): PublicPlaceName | null {
  if (!value || typeof value !== "object") return null;
  const place = value as Record<string, unknown>;
  if (typeof place.nameEn !== "string" || typeof place.nameBn !== "string") return null;
  return { nameEn: place.nameEn, nameBn: place.nameBn };
}
