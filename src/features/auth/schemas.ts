import { z } from "zod";
import { authMessages } from "./messages";

export const loginSchema = z
  .object({
    email: z.string().trim().email(authMessages.emailInvalid),
    password: z.string().min(1, authMessages.passwordInvalid).max(200, authMessages.passwordInvalid),
  })
  .strict();

export type LoginValues = z.infer<typeof loginSchema>;

const levels = ["PRIMARY", "JUNIOR_SECONDARY", "SECONDARY", "HIGHER_SECONDARY", "SCHOOL_AND_COLLEGE", "MADRASAH", "TECHNICAL", "COLLEGE"] as const;
const institutionTypes = ["SCHOOL", "COLLEGE", "SCHOOL_AND_COLLEGE", "MADRASAH", "TECHNICAL_INSTITUTE", "COACHING_CENTER", "TRAINING_CENTER", "OTHER"] as const;

export const registerSchema = z
  .object({
    nameEn: z.string().trim().min(1, authMessages.nameEn).max(200),
    nameBn: z.string().trim().min(1, authMessages.nameBn).max(200),
    level: z.union([z.enum(levels), z.literal("")]).optional(),
    institutionType: z.union([z.enum(institutionTypes), z.literal("")]).optional(),
    siteSlug: z.string().trim().max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, authMessages.siteSlugHint),
    officialEmail: z.union([z.string().trim().email(authMessages.emailInvalid).max(200), z.literal("")]).optional(),
    officialPhone: z.string().trim().max(40).regex(/^[0-9+() .-]*$/, authMessages.checkFields).optional(),
    addressEn: z.string().trim().max(300).regex(/^[^<>]*$/, authMessages.checkFields).optional(),
    adminDisplayName: z.string().trim().min(1, authMessages.adminName).max(200),
    adminEmail: z.string().trim().email(authMessages.emailInvalid).max(200),
    password: z.string().min(12, authMessages.passwordRules).max(200),
    confirmPassword: z.string().min(12, authMessages.passwordRules).max(200),
  })
  .strict()
  .refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: authMessages.passwordMismatch });

export type RegisterValues = z.infer<typeof registerSchema>;
