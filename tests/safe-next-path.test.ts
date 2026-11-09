import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-next-path";

describe("safeNextPath", () => {
  it("keeps a same-origin relative path", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/admin/pages")).toBe("/admin/pages");
  });

  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)"])(
    "rejects %s",
    (value) => {
      expect(safeNextPath(value)).toBeNull();
    },
  );

  it("rejects encoded open redirects", () => {
    expect(safeNextPath("/%2F%2Fevil.com")).toBeNull();
    expect(safeNextPath(encodeURIComponent("https://evil.com"))).toBeNull();
  });
});
