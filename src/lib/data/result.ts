import { ApiError } from "@/lib/api-error";
import { reportError, type ErrorReport } from "@/lib/report-error";

export type FetchResult<T> =
  | { status: "success"; data: T }
  | { status: "not-found" }
  | { status: "unauthorized" }
  | { status: "forbidden" }
  | { status: "unavailable"; requestId?: string }
  | { status: "invalid-response" };

export function mapFetchError(error: unknown, scope: string): FetchResult<never> {
  if (!(error instanceof ApiError)) {
    reportError({ scope, status: 0 });
    return { status: "unavailable" };
  }
  if (error.status === 404) return { status: "not-found" };
  if (error.status === 401) return { status: "unauthorized" };
  if (error.status === 403) return { status: "forbidden" };
  if (error.status === 0 || error.status === 429 || error.status >= 500 || error.kind === "timeout") {
    const event: ErrorReport = { scope, status: error.status, requestId: error.requestId };
    reportError(event);
    return { status: "unavailable", requestId: error.requestId };
  }
  reportError({ scope, status: error.status, requestId: error.requestId });
  return { status: "invalid-response" };
}
