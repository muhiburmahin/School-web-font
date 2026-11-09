import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api-client";
import { authCookieHeader } from "@/lib/auth-cookies";
import { getServerEnv } from "@/lib/env.server";
import { nodeFetch, requestTenantHost } from "@/lib/tenant-host";
import { mapFetchError, type FetchResult } from "./result";

export const fetchAuthed = cache(async (path: string): Promise<FetchResult<unknown>> => {
  const env = getServerEnv();
  const jar = await cookies();
  const cookieHeader = authCookieHeader(jar.toString(), env.sessionCookieName, env.csrfCookieName);
  const tenantHost = await requestTenantHost();
  try {
    const data = await apiFetch<unknown>(path, {
      baseUrl: env.serverApiBaseUrl,
      cookieHeader,
      cache: "no-store",
      tenantHost,
      fetchImpl: tenantHost ? nodeFetch : undefined,
    });
    return { status: "success", data };
  } catch (error) {
    return mapFetchError(error, "authed");
  }
});
