import { describe, expect, it } from "vitest";
import { mediaMessages } from "@/features/media/messages";
import { mediaDetailPath, mediaListPath, parseMediaList } from "@/features/media/schemas";

const asset = {
  id: "11111111-1111-4111-8111-111111111111",
  kind: "IMAGE",
  publicUrl: "https://cdn.example/photo.png",
  mimeType: "image/png",
  originalFilename: "photo.png",
  sizeBytes: 1200,
  width: 10,
  height: 12,
  durationSeconds: null,
  altBn: "ছবি",
  altEn: "Photo",
  isDecorative: false,
};

describe("media contract parsing", () => {
  it("keeps public fields and drops an unsafe image URL", () => {
    const list = parseMediaList({
      items: [{ ...asset, publicUrl: "javascript:alert(1)" }],
      nextCursor: null,
      institutionId: "secret",
    });
    expect(list?.items[0]?.publicUrl).toBeNull();
    expect(list?.items[0]).not.toHaveProperty("institutionId");
    expect(JSON.stringify(list)).not.toContain("javascript");
  });

  it("rejects a list that is not the public shape", () => {
    expect(parseMediaList({ items: [{ ...asset, kind: "ARCHIVE" }] })).toBeNull();
  });

  it("builds the list path from the contract and does not add extra query keys", () => {
    expect(mediaListPath({ limit: 20, cursor: "abc" })).toBe("/api/v1/media?limit=20&cursor=abc");
    expect(mediaDetailPath(asset.id)).toBe(`/api/v1/media/${asset.id}`);
    expect(mediaMessages.changesUnavailable).toBe("Media changes are not available yet.");
  });
});
