import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return files(full);
    return full.endsWith(".ts") || full.endsWith(".tsx") ? [full] : [];
  });
}

describe("feature boundaries", () => {
  const root = path.resolve(process.cwd(), "src/features");
  const sourceFiles = files(root);

  it("keeps API paths inside each feature api module", () => {
    const offenders = sourceFiles.filter((file) => {
      if (file.endsWith(`${path.sep}api.ts`)) return false;
      const source = readFileSync(file, "utf8");
      return source.includes("/api/v1") || source.includes("http://localhost:3000");
    });
    expect(offenders).toEqual([]);
  });

  it("does not import one feature from another", () => {
    const offenders = sourceFiles.filter((file) => {
      const feature = path.relative(root, file).split(path.sep)[0];
      const source = readFileSync(file, "utf8");
      const imports = source.matchAll(/@\/features\/([a-z0-9-]+)/g);
      return [...imports].some((match) => match[1] !== feature);
    });
    expect(offenders).toEqual([]);
  });

  it("keeps server-only modules out of client components", () => {
    const offenders = sourceFiles.filter((file) => {
      const source = readFileSync(file, "utf8");
      if (!source.includes('"use client"')) return false;
      return (
        source.includes("@/lib/auth/dal") ||
        source.includes("@/lib/env.server") ||
        source.includes("@/lib/data/") ||
        source.includes("server-only")
      );
    });
    expect(offenders).toEqual([]);
  });
});
