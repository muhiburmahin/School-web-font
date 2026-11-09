import "server-only";
import { cache } from "react";
import { apiFetch } from "@/lib/api-client";
import { getServerEnv } from "@/lib/env.server";
import { nodeFetch, requestDevSiteSlug, requestTenantHost } from "@/lib/tenant-host";
import { mapFetchError, type FetchResult } from "./result";

export const fetchPublic = cache(async (path: string, revalidate: number, tags: string): Promise<FetchResult<unknown>> => {
  const [tenantHost, devSiteSlug] = await Promise.all([requestTenantHost(), requestDevSiteSlug()]);
  try {
    const data = await apiFetch<unknown>(path, {
      baseUrl: getServerEnv().serverApiBaseUrl,
      revalidate,
      tags: tags.length > 0 ? tags.split(",") : undefined,
      tenantHost,
      devSiteSlug,
      fetchImpl: tenantHost ? nodeFetch : undefined,
    });
    return { status: "success", data };
  } catch (error) {
    return mapFetchError(error, "public");
  }
});
