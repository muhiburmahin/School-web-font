"use server";

import { revalidateTag } from "next/cache";
import { backendContract } from "@/config/backend-contract";
import { verifySession } from "@/lib/auth/dal";

export async function revalidatePages(): Promise<{ ok: boolean }> {
  const session = await verifySession();
  if (session.status !== "authenticated") return { ok: false };
  if (!session.user.permissions.includes(backendContract.pages.permission)) return { ok: false };
  revalidateTag("pages", "max");
  return { ok: true };
}
