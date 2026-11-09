import { backendContract } from "@/config/backend-contract";
import { apiFetch } from "@/lib/api-client";
import { auditPath, institutionPath, parseAuditPage, parseCreatedAdmin, parseCreatedInstitution, parseDomainChallenge, parseInstitutionDetail, parseInstitutionList } from "./schemas";
import type { DomainChallenge } from "./schemas";
import type { AdminFormValues, InstitutionCreateValues, InstitutionFormValues } from "./schemas";

export async function fetchInstitutions(filter: { q?: string; status?: string; institutionType?: string; cursor?: string | null } = {}) {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.status) params.set("status", filter.status);
  if (filter.institutionType) params.set("institutionType", filter.institutionType);
  if (filter.cursor) params.set("cursor", filter.cursor);
  const path = params.size > 0 ? `${backendContract.platform.institutions.path}?${params.toString()}` : backendContract.platform.institutions.path;
  const data = await apiFetch<unknown>(path);
  const parsed = parseInstitutionList(data);
  if (!parsed) throw new Error("invalid");
  return parsed;
}

export async function fetchInstitution(id: string) {
  const data = await apiFetch<unknown>(institutionPath(backendContract.platform.one.path, id));
  const parsed = parseInstitutionDetail(data);
  if (!parsed) throw new Error("invalid");
  return parsed;
}

export async function createInstitution(input: InstitutionCreateValues) {
  const data = await apiFetch<unknown>(backendContract.platform.create.path, { method: "POST", body: input });
  const parsed = parseCreatedInstitution(data);
  if (!parsed) throw new Error("invalid");
  return parsed;
}

export function updateInstitution(id: string, input: InstitutionFormValues) {
  return apiFetch(institutionPath(backendContract.platform.update.path, id), { method: "PATCH", body: input });
}

export function suspendInstitution(id: string) {
  return apiFetch(institutionPath(backendContract.platform.suspend.path, id), { method: "POST" });
}

export function reactivateInstitution(id: string) {
  return apiFetch(institutionPath(backendContract.platform.reactivate.path, id), { method: "POST" });
}

export function markInstitutionReady(id: string) {
  return apiFetch(institutionPath(backendContract.platform.onboarding.path, id), { method: "POST", body: { onboardingStatus: "READY" } });
}

export async function addInstitutionDomain(id: string, hostname: string): Promise<DomainChallenge | null> {
  const data = await apiFetch<unknown>(institutionPath(backendContract.platform.domains.path, id), { method: "POST", body: { hostname } });
  return parseDomainChallenge(data);
}

export function verifyInstitutionDomain(id: string, domainId: string) {
  return apiFetch(domainPath(backendContract.platform.verifyDomain.path, id, domainId), { method: "POST" });
}

export function assignPlatformSubdomain(id: string) {
  return apiFetch(institutionPath(backendContract.platform.subdomain.path, id), { method: "POST" });
}

export async function retryDomainChallenge(id: string, domainId: string): Promise<DomainChallenge | null> {
  const data = await apiFetch<unknown>(domainPath(backendContract.platform.challengeDomain.path, id, domainId), { method: "POST" });
  return parseDomainChallenge(data);
}

export function setDomainRouting(id: string, domainId: string, enabled: boolean) {
  const path = enabled ? backendContract.platform.enableDomain.path : backendContract.platform.disableDomain.path;
  return apiFetch(domainPath(path, id, domainId), { method: "POST" });
}

export function setPrimaryDomain(id: string, domainId: string) {
  return apiFetch(domainPath(backendContract.platform.primaryDomain.path, id, domainId), { method: "POST" });
}

export function removeInstitutionDomain(id: string, domainId: string, confirmPrimary: boolean) {
  const path = `${institutionPath(backendContract.platform.domains.path, id)}/${encodeURIComponent(domainId)}`;
  return apiFetch(confirmPrimary ? `${path}?confirmPrimary=true` : path, { method: "DELETE" });
}

function domainPath(path: string, institutionId: string, domainId: string) {
  return path.replace(":institutionId", encodeURIComponent(institutionId)).replace(":domainId", encodeURIComponent(domainId));
}

export function setInstitutionAdminStatus(id: string, userId: string, status: "ACTIVE" | "DISABLED") {
  return apiFetch(backendContract.platform.adminStatus.path.replace(":institutionId", encodeURIComponent(id)).replace(":userId", encodeURIComponent(userId)), {
    method: "PATCH",
    body: { status },
  });
}

export async function createInstitutionAdmin(id: string, input: AdminFormValues) {
  const data = await apiFetch<unknown>(institutionPath(backendContract.platform.admins.path, id), { method: "POST", body: input });
  const parsed = parseCreatedAdmin(data);
  if (!parsed) throw new Error("invalid");
  return parsed;
}

export async function fetchPlatformSummary() {
  const data = await apiFetch<unknown>(backendContract.platform.summary.path);
  if (!data || typeof data !== "object") throw new Error("invalid");
  const row = data as Record<string, unknown>;
  const keys = ["total", "active", "suspended", "pendingSetup", "ready", "needsReview", "withVerifiedDomain", "withoutVerifiedDomain"] as const;
  const summary = {} as Record<(typeof keys)[number], number>;
  for (const key of keys) {
    if (typeof row[key] !== "number") throw new Error("invalid");
    summary[key] = row[key];
  }
  return summary;
}

export function repairStarterSite(id: string) {
  return apiFetch(institutionPath(backendContract.platform.repairStarter.path, id), { method: "POST" });
}

export async function fetchAudit(cursor: string | null) {
  const data = await apiFetch<unknown>(auditPath(cursor));
  const parsed = parseAuditPage(data);
  if (!parsed) throw new Error("invalid");
  return parsed;
}
