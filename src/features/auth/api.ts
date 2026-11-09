import { backendContract } from "@/config/backend-contract";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/api-client";

export const authKeys = {
  all: ["auth"] as const,
  me: ["auth", "me"] as const,
};

export interface LoginResult {
  mfaRequired: boolean;
  user?: { scope: 'PLATFORM' | 'INSTITUTION'; fullName?: string; displayName?: string };
  redirectTo?: string;
}

export async function login(input: { email: string; password: string; rememberMe?: boolean }): Promise<LoginResult> {
  const body = (await apiFetch<any>(backendContract.auth.login.path, {
    method: backendContract.auth.login.method,
    body: { email: input.email, password: input.password, rememberMe: input.rememberMe },
  })) as any;

  if (!body || typeof body !== "object") {
    throw new ApiError({
      status: 200,
      kind: "client",
      messages: ["The server returned an unreadable response."],
    });
  }

  return {
    mfaRequired: body.mfaRequired ?? false,
    user: body.user,
    redirectTo: body.redirectTo,
  };
}

export async function registerInstitution(input: Record<string, any>): Promise<{ registered: true; message?: string; slug?: string }> {
  const body = (await apiFetch<any>('/api/v1/auth/register-institution', {
    method: 'POST',
    body: input,
  })) as any;

  return {
    registered: true,
    message: body?.message,
    slug: body?.slug,
  };
}

export async function logout(): Promise<void> {
  await apiFetch<void>(backendContract.auth.logout.path, {
    method: backendContract.auth.logout.method,
  });
}
