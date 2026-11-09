"use server";

import { revalidateTag } from "next/cache";
import { backendContract } from "@/config/backend-contract";
import { verifySession } from "@/lib/auth/dal";

export async function revalidateExternalLinks(): Promise<{ ok: boolean }> {
  const session = await verifySession();
  if (session.status !== "authenticated") return { ok: false };
  if (!session.user.permissions.includes(backendContract.externalLinks.permission)) return { ok: false };
  revalidateTag("external-links", "max");
  return { ok: true };
}
