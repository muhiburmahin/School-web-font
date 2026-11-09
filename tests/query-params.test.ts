import { describe, expect, it } from "vitest";
import { parseRecordId } from "@/lib/validation/identifiers";
import { parseCategory, parseListQuery } from "@/lib/validation/query";

describe("search params", () => {
  it("reads the first value and uses safe defaults", () => {
    expect(parseListQuery({ limit: ["10", "50"], cursor: "abc" })).toEqual({ limit: 10, cursor: "abc" });
    expect(parseListQuery({ limit: "nope", cursor: "bad cursor" })).toEqual({ limit: 20, cursor: null });
  });

  it("rejects an invalid id or category before a fetch would use it", () => {
    expect(parseRecordId("https://evil.com")).toBeNull();
    expect(parseCategory("javascript:alert(1)")).toEqual({ ok: false });
  });
});
