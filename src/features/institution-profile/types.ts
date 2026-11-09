export interface PublicPlaceName {
  nameEn: string;
  nameBn: string;
}

export interface PublicInstitutionProfile {
  nameEn: string;
  nameBn: string;
  level: string | null;
  establishedYear: number | null;
  addressEn: string | null;
  addressBn: string | null;
  officialEmail: string | null;
  officialPhone: string | null;
  district: PublicPlaceName | null;
  upazila: PublicPlaceName | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  actionColor: string | null;
  font: "sans" | "serif" | "bangla";
  header: "band" | "compact";
  footer: "columns" | "simple";
  preset: "general" | "school" | "college" | "madrasah" | "technical" | "coaching" | "custom";
}

export interface ProfileView extends PublicInstitutionProfile {
  title: string;
}

export const profileUnavailable: ProfileView = {
  nameEn: "Institution",
  nameBn: "",
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
  primaryColor: null,
  secondaryColor: null,
  actionColor: null,
  font: "sans",
  header: "band",
  footer: "columns",
  preset: "custom",
  title: "Institution",
};
