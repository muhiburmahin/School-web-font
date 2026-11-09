import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : full.endsWith(".ts") || full.endsWith(".tsx") ? [full] : [];
  });
}

describe("server-only boundary", () => {
  it("does not import the session DAL or server env from client modules", () => {
    const root = path.resolve(process.cwd(), "src");
    const offenders = files(root).filter((file) => {
      const source = readFileSync(file, "utf8");
      if (!source.includes('"use client"')) return false;
      return source.includes("@/lib/auth/dal") || source.includes("@/lib/env.server") || source.includes("localStorage") || source.includes("sessionStorage");
    });
    expect(offenders).toEqual([]);
  });
});
