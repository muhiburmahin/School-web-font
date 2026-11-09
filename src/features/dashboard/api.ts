import { apiFetch } from "@/lib/api-client";
import { parseInstitutionSummary } from "./schemas";

export async function fetchInstitutionSummary() {
  const data = await apiFetch<unknown>("/api/v1/dashboard");
  const parsed = parseInstitutionSummary(data);
  if (!parsed) throw new Error("invalid");
  return parsed;
}
