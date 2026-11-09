import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { backendContract } from "@/config/backend-contract";
import { parseCurrentUser, type CurrentUser, type SessionResult } from "@/features/auth/session";
import { fetchAuthed } from "@/lib/data/authed";
import { getServerEnv } from "@/lib/env.server";

export const verifySession = cache(async (): Promise<SessionResult> => {
  const env = getServerEnv();
  const jar = await cookies();
  const sessionToken =
    jar.get(env.sessionCookieName)?.value ||
    jar.get("mrm_sid")?.value ||
    jar.get("sid")?.value;
  if (!sessionToken) return { status: "anonymous" };

  const result = await fetchAuthed(backendContract.auth.me.path);
  if (result.status === "unauthorized") return { status: "anonymous" };
  if (result.status === "forbidden") return { status: "forbidden" };
  if (result.status !== "success") return { status: "unavailable" };
  const user = parseCurrentUser(result.data);
  if (!user) return { status: "unavailable" };
  return { status: "authenticated", user };
});

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await verifySession();
  return session.status === "authenticated" ? session.user : null;
});
