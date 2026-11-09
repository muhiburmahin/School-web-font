import { z } from "zod";

const summarySchema = z.object({
  nameEn: z.string(),
  nameBn: z.string(),
  level: z.string().nullable(),
  institutionType: z.string().nullable(),
  siteSlug: z.string(),
  status: z.string(),
  onboardingStatus: z.string(),
  logoUrl: z.string().nullable(),
  homePageId: z.string().nullable(),
  counts: z.object({
    pages: z.number(),
    publishedPages: z.number(),
    draftPages: z.number(),
    notices: z.number(),
    staff: z.number(),
    albums: z.number(),
    media: z.number(),
  }),
  activity: z.array(z.object({ id: z.string(), occurredAt: z.string(), action: z.string(), entityType: z.string() })),
  website: z.object({
    provisioned: z.boolean(),
    deploymentMode: z.string(),
    verifiedHostnames: z.array(z.string()),
    unverifiedHostnames: z.array(z.string()),
    publicUrl: z.string().nullable(),
    developmentPreviewPath: z.string().nullable().optional(),
    hostingConfigured: z.boolean(),
    publiclyAccessible: z.boolean(),
  }),
});

export type InstitutionSummary = z.infer<typeof summarySchema>;

export function parseInstitutionSummary(value: unknown): InstitutionSummary | null {
  const parsed = summarySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
