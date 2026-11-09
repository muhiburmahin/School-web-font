import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["bn", "en"] as const;
export type Locale = (typeof locales)[number];

export function readLocale(value: string | undefined): Locale {
  return value === "en" ? "en" : "bn";
}

export default getRequestConfig(async () => {
  const jar = await cookies();
  const locale = readLocale(jar.get("NEXT_LOCALE")?.value);
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
