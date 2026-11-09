import { z } from "zod";
import { normalizeSafeString } from "./text";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseRecordId(value: string | undefined): string | null {
  if (!value || !uuidPattern.test(value)) return null;
  return value;
}

export const slugSchema = z.string().transform((value, context) => {
  const safe = normalizeSafeString(value, 80);
  if (!safe || !slugPattern.test(safe)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "invalid slug" });
    return z.NEVER;
  }
  return safe;
});

export function parseSlug(value: string): string | null {
  const parsed = slugSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
