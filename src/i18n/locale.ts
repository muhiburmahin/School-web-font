"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { readLocale, type Locale } from "./request";

export async function setLocale(locale: Locale) {
  const next = readLocale(locale);
  const jar = await cookies();
  jar.set("NEXT_LOCALE", next, { path: "/", sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/", "layout");
}
