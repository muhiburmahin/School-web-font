export function byLocale(locale: string, bn: string | null | undefined, en: string | null | undefined): string {
  const primary = locale === "en" ? en : bn;
  const fallback = locale === "en" ? bn : en;
  const chosen = primary?.trim() || fallback?.trim() || "";
  return chosen;
}

export function formatDhaka(value: string | number | Date, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "bn-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
    numberingSystem: locale === "en" ? "latn" : "beng",
  }).format(date);
}
