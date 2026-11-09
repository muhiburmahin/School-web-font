export type MediaKind = "IMAGE" | "VIDEO" | "DOCUMENT";

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  publicUrl: string | null;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  altBn: string | null;
  altEn: string | null;
  isDecorative: boolean;
}

export interface MediaList {
  items: MediaAsset[];
  nextCursor: string | null;
}
