import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiError } from "@/lib/api-error";

export function applyApiFieldErrors<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  labels: Partial<Record<keyof T & string, string>>,
): boolean {
  let applied = false;
  for (const field of Object.keys(labels) as (keyof T & string)[]) {
    const message = labels[field];
    if (!message || !error.fieldErrors[field]?.length) continue;
    setError(field as Path<T>, { message });
    applied = true;
  }
  return applied;
}
