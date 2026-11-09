import { z } from "zod";
import { backendContract } from "@/config/backend-contract";

const levels = ["PRIMARY", "JUNIOR_SECONDARY", "SECONDARY", "HIGHER_SECONDARY", "SCHOOL_AND_COLLEGE", "MADRASAH", "TECHNICAL", "COLLEGE"] as const;

export const institutionFormSchema = z.object({
  nameBn: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().min(1).max(200),
  level: z.enum(levels).optional(),
});

const reservedSiteSlugs = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "auth",
  "docs",
  "external-links",
  "health",
  "login",
  "media",
  "notices",
  "pages",
  "platform",
  "www",
]);

export function institutionCreateSchema(messages: { siteSlugInvalid: string; emailInvalid: string; nameInvalid: string }) {
  return institutionFormSchema.extend({
    level: z
      .union([z.enum(levels), z.literal("")])
      .optional()
      .transform((value) => (value ? value : undefined)),
    siteSlug: z
      .string()
      .max(80, messages.siteSlugInvalid)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, messages.siteSlugInvalid)
      .refine((value) => !reservedSiteSlugs.has(value), messages.siteSlugInvalid),
    adminEmail: z.string().trim().email(messages.emailInvalid).max(200, messages.emailInvalid),
    adminDisplayName: z.string().trim().min(1, messages.nameInvalid).max(200, messages.nameInvalid),
  });
}

export const adminFormSchema = z.object({
  email: z.string().trim().email().max(200),
  displayName: z.string().trim().min(1).max(200),
});

const institutionSchema = z.object({
  id: z.string().uuid(),
  siteSlug: z.string().optional(),
  onboardingStatus: z.enum(["PENDING_SETUP", "READY", "NEEDS_REVIEW"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
  createdAt: z.string(),
  nameBn: z.string().nullable(),
  nameEn: z.string().nullable(),
  level: z.string().nullable(),
  institutionType: z.string().nullable().optional(),
  domains: z.array(z.object({ hostname: z.string(), verifiedAt: z.string().nullable() })).optional(),
  publicUrl: z.string().nullable().optional(),
  developmentPreviewPath: z.string().nullable().optional(),
});

const listSchema = z.object({
  items: z.array(institutionSchema),
  nextCursor: z.string().nullable(),
});

const detailSchema = institutionSchema.extend({
  domains: z.array(z.object({
    id: z.string(),
    hostname: z.string(),
    verifiedAt: z.string().nullable(),
    isPrimary: z.boolean().optional(),
    routingEnabled: z.boolean().optional(),
    challengePending: z.boolean().optional(),
    challengeHost: z.string().optional(),
  })),
  platformBaseDomain: z.string().nullable().optional(),
  platformSubdomain: z.string().nullable().optional(),
  publicUrl: z.string().nullable().optional(),
  developmentPreviewPath: z.string().nullable().optional(),
  hostingConfigured: z.boolean().optional(),
  publiclyAccessible: z.boolean().optional(),
  admins: z.array(
    z.object({
      id: z.string(),
      email: z.string(),
      displayName: z.string(),
      status: z.string(),
      mustChangePassword: z.boolean(),
    }),
  ),
});

const auditSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      occurredAt: z.string(),
      action: z.string(),
      entityType: z.string(),
      entityId: z.string().nullable(),
      institutionId: z.string().nullable(),
      actorId: z.string().nullable(),
    }),
  ),
  nextCursor: z.string().nullable(),
});

const createdAdminSchema = z.object({
  id: z.string(),
  email: z.string(),
  displayName: z.string(),
  temporaryPassword: z.string().min(12),
});

const createdInstitutionSchema = detailSchema.extend({
  admin: createdAdminSchema,
});

export type InstitutionFormValues = z.infer<typeof institutionFormSchema>;
export type InstitutionCreateValues = z.infer<ReturnType<typeof institutionCreateSchema>>;
export type AdminFormValues = z.infer<typeof adminFormSchema>;
export type InstitutionList = z.infer<typeof listSchema>;
export type InstitutionDetail = z.infer<typeof detailSchema>;
export type AuditPage = z.infer<typeof auditSchema>;
export type CreatedAdmin = z.infer<typeof createdAdminSchema>;
export type CreatedInstitution = z.infer<typeof createdInstitutionSchema>;

export function parseInstitutionList(value: unknown): InstitutionList | null {
  const parsed = listSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseInstitutionDetail(value: unknown): InstitutionDetail | null {
  const parsed = detailSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseAuditPage(value: unknown): AuditPage | null {
  const parsed = auditSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseCreatedInstitution(value: unknown): CreatedInstitution | null {
  const parsed = createdInstitutionSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parseCreatedAdmin(value: unknown): CreatedAdmin | null {
  const parsed = createdAdminSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

const domainChallengeSchema = z.object({
  challenge: z.object({
    host: z.string().min(1),
    value: z.string().min(1),
    expiresAt: z.string().min(1),
  }).optional(),
});

export type DomainChallenge = { host: string; value: string; expiresAt: string };

export function parseDomainChallenge(value: unknown): DomainChallenge | null {
  const parsed = domainChallengeSchema.safeParse(value);
  if (!parsed.success || !parsed.data.challenge) return null;
  return parsed.data.challenge;
}

export function canReadPlatform(permissions: readonly string[]): boolean {
  return (
    permissions.includes(backendContract.platform.read) ||
    permissions.includes("platform:institution:read") ||
    permissions.includes("platform.institutions.read") ||
    permissions.includes("platform:*") ||
    permissions.includes("SUPER_ADMIN")
  );
}

export function platformView(permissions: readonly string[], errorKind?: string): "ready" | "hidden" | "forbidden" {
  if (!canReadPlatform(permissions)) return "hidden";
  if (errorKind === "forbidden") return "forbidden";
  return "ready";
}

export function institutionPath(template: string, institutionId: string): string {
  return template.replace(":institutionId", encodeURIComponent(institutionId));
}

export function auditPath(cursor: string | null): string {
  const path = backendContract.platform.audit.path;
  return cursor ? `${path}?limit=20&cursor=${encodeURIComponent(cursor)}` : `${path}?limit=20`;
}
