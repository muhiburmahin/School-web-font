import { describe, expect, it } from "vitest";
import bn from "../messages/bn.json";
import en from "../messages/en.json";

function keys(value: unknown, prefix = ""): string[] {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

describe("locale messages", () => {
  it("keeps Bangla and English keys the same", () => {
    expect(keys(bn).sort()).toEqual(keys(en).sort());
  });
});
