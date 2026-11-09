import "server-only";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { publicCanonical, requestTenantHost } from "./tenant-host";

export async function withCanonical(path: string, metadata: Metadata): Promise<Metadata> {
  const headerList = await headers();
  const canonical = publicCanonical(await requestTenantHost(), path, headerList.get("x-forwarded-proto"));
  if (!canonical) return metadata;
  return {
    ...metadata,
    alternates: { canonical },
    openGraph: { ...metadata.openGraph, url: canonical },
  };
}
