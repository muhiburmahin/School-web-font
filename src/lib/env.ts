import { z } from "zod";
import { backendContract } from "@/config/backend-contract";
import { readApiBaseUrl } from "./api-base";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_API_BASE_URL: z.string().optional(),
  SESSION_COOKIE_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_CSRF_COOKIE_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_CSRF_HEADER: z.string().min(1).optional(),
  NEXT_PUBLIC_API_MOCKS: z.enum(["true", "false"]).optional(),
});

export interface PublicEnv {
  nodeEnv: "development" | "test" | "production";
  apiBaseUrl: string;
  sessionCookieName: string;
  csrfCookieName: string;
  csrfHeaderName: string;
  apiMocks: boolean;
}

export function readEnv(source: Record<string, string | undefined>): PublicEnv {
  const parsed = schema.parse(source);
  const apiBaseUrl = readApiBaseUrl(parsed.NEXT_PUBLIC_API_BASE_URL, parsed.NODE_ENV);

  return {
    nodeEnv: parsed.NODE_ENV,
    apiBaseUrl,
    sessionCookieName: parsed.SESSION_COOKIE_NAME || backendContract.sessionCookieName,
    csrfCookieName: parsed.NEXT_PUBLIC_CSRF_COOKIE_NAME || backendContract.csrfCookieName,
    csrfHeaderName: parsed.NEXT_PUBLIC_CSRF_HEADER || backendContract.csrfHeaderName,
    apiMocks: parsed.NODE_ENV !== "production" && parsed.NEXT_PUBLIC_API_MOCKS === "true",
  };
}

export function getPublicEnv(): PublicEnv {
  return readEnv({
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
    NEXT_PUBLIC_CSRF_COOKIE_NAME: process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME,
    NEXT_PUBLIC_CSRF_HEADER: process.env.NEXT_PUBLIC_CSRF_HEADER,
    NEXT_PUBLIC_API_MOCKS: process.env.NEXT_PUBLIC_API_MOCKS,
  });
}

export const getEnv = getPublicEnv;
