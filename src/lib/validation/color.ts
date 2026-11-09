import { z } from "zod";

export const themeHexPattern = /^#[0-9A-Fa-f]{6}$/;

export const themeHexSchema = z.string().regex(themeHexPattern);

export function parseThemeHex(value: unknown): string | null {
  const parsed = themeHexSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
