import "server-only";
import { isSameOriginApiBase, readBackendOrigin } from "./api-base";
import { getPublicEnv, type PublicEnv } from "./env";
import { parseMediaOrigins } from "./security-headers";

export interface ServerEnv extends PublicEnv {
  cspReportOnly: boolean;
  mediaImageOrigins: string[];
  serverApiBaseUrl: string;
}

export function getServerEnv(): ServerEnv {
  const publicEnv = getPublicEnv();
  return {
    ...publicEnv,
    cspReportOnly: process.env.CSP_REPORT_ONLY === "true",
    mediaImageOrigins: parseMediaOrigins(process.env.MEDIA_IMAGE_ORIGINS),
    serverApiBaseUrl: serverApiBase(publicEnv.apiBaseUrl),
  };
}

function serverApiBase(publicBase: string): string {
  if (!isSameOriginApiBase(publicBase)) return publicBase;
  const origin = readBackendOrigin(process.env.BACKEND_ORIGIN);
  if (!origin) {
    throw new Error("BACKEND_ORIGIN is required when NEXT_PUBLIC_API_BASE_URL is /api/v1.");
  }
  return origin;
}
