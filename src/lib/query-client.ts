import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-error";

export function queryRetry(failureCount: number, error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 401 || error.status === 403 || error.status === 404) return false;
  if (error.kind === "network" || error.kind === "timeout" || error.kind === "server") {
    return failureCount < 2;
  }
  return false;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: queryRetry,
        staleTime: 60_000,
      },
    },
  });
}
