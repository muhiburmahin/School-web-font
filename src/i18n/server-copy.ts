import "server-only";
import { getMessages } from "next-intl/server";
import type { AppMessages } from "./types";

export async function copy<K extends keyof AppMessages>(namespace: K): Promise<AppMessages[K]> {
  return ((await getMessages()) as AppMessages)[namespace];
}
