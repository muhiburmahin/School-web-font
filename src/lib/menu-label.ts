import { byLocale } from "@/i18n/text";

export function normalizeInstitutionName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function sameInstitutionName(primary: string, secondary: string): boolean {
  const left = normalizeInstitutionName(primary);
  const right = normalizeInstitutionName(secondary);
  return left.length > 0 && left === right;
}

export function configuredMenuLabel(pageTitle: string, navigationLabel: string | null | undefined): string {
  if (typeof navigationLabel === "string" && navigationLabel.trim().length > 0) return navigationLabel;
  return pageTitle;
}

const starterMenuTitles: Record<string, { en: string; bn: string }> = {
  home: { en: "Home", bn: "হোম" },
  about: { en: "About the Institution", bn: "প্রতিষ্ঠান পরিচিতি" },
  administration: { en: "Administration and Teachers", bn: "প্রশাসন ও শিক্ষক" },
  academic: { en: "Academic Information", bn: "একাডেমিক তথ্য" },
  admission: { en: "Admission", bn: "ভর্তি" },
  "notice-board": { en: "Notices", bn: "নোটিশ" },
  notices: { en: "Notices", bn: "নোটিশ" },
  examinations: { en: "Examination and Results", bn: "পরীক্ষা ও ফলাফল" },
  gallery: { en: "Gallery", bn: "গ্যালারি" },
  contact: { en: "Contact", bn: "যোগাযোগ" },
};

const shortMenuTitles: Record<string, { en: string; bn: string }> = {
  home: { en: "Home", bn: "হোম" },
  about: { en: "About", bn: "পরিচিতি" },
  administration: { en: "Administration", bn: "প্রশাসন" },
  academic: { en: "Academic", bn: "একাডেমিক" },
  admission: { en: "Admission", bn: "ভর্তি" },
  "notice-board": { en: "Notice", bn: "নোটিশ" },
  notices: { en: "Notice", bn: "নোটিশ" },
  examinations: { en: "Results", bn: "ফলাফল" },
  gallery: { en: "Gallery", bn: "গ্যালারি" },
  contact: { en: "Contact", bn: "যোগাযোগ" },
};

function isStarterMenuTitle(slug: string, value: string): boolean {
  const known = starterMenuTitles[slug];
  return known !== undefined && (value === known.en || value === known.bn);
}

export function publicMenuLabel(input: {
  slug: string;
  pageTitle: string;
  labelBn?: string | null;
  labelEn?: string | null;
  locale: string;
}): string {
  const localized = byLocale(input.locale, input.labelBn, input.labelEn).trim();
  const configured = localized || input.pageTitle.trim();
  const short = shortMenuTitles[input.slug];
  const usesStarterTitle = isStarterMenuTitle(input.slug, configured) || (!localized && isStarterMenuTitle(input.slug, input.pageTitle));
  if (short && usesStarterTitle) return byLocale(input.locale, short.bn, short.en);
  return configured;
}
