import { parseThemeHex, themeHexSchema } from "@/lib/validation/color";

export const themeColorSchema = themeHexSchema;

export function publicThemeColor(value: unknown): string | null {
  return parseThemeHex(value);
}
