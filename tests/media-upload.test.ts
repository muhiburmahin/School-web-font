import { afterEach, describe, expect, it } from "vitest";
import { uploadMedia } from "@/features/media/upload";

const asset = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  kind: "IMAGE",
  publicUrl: "https://res.cloudinary.com/testcloud/image/upload/v1/a.png",
  mimeType: "image/png",
  originalFilename: "a.png",
  sizeBytes: 12,
  width: 2,
  height: 2,
  durationSeconds: null,
  altBn: null,
  altEn: null,
  isDecorative: false,
};

describe("media upload client", () => {
  const previous = process.env.NEXT_PUBLIC_API_BASE_URL;
  afterEach(() => {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = previous;
  });

  it("posts the file to the configured API origin", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:5000";
    let seenUrl = "";
    let contentType: string | null = null;
    let fields: string[] = [];
    const file = new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" });
    await uploadMedia(file, async (url, init) => {
      seenUrl = String(url);
      contentType = new Headers(init?.headers).get("content-type");
      const body = init?.body;
      if (body instanceof FormData) fields = [...body.keys()];
      return new Response(JSON.stringify(asset), { status: 200 });
    });
    expect(seenUrl).toBe("http://localhost:5000/api/v1/media");
    expect(contentType).toBeNull();
    expect(fields).toEqual(["file"]);
  });
});