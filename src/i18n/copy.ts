"use client";

import { useMessages } from "next-intl";
import type { AppMessages } from "./types";

export function useCopy<K extends keyof AppMessages>(namespace: K): AppMessages[K] {
  return (useMessages() as AppMessages)[namespace];
}
