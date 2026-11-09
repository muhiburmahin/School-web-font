import { backendContract } from "@/config/backend-contract";
import { ApiError, apiErrorFromBody } from "@/lib/api-error";
import { browserCookieSource, readCsrfToken } from "@/lib/csrf";
import { getPublicEnv } from "@/lib/env";
import { parseMediaAsset } from "./schemas";
import type { MediaAsset } from "./types";

export async function uploadMedia(file: File, fetchImpl: typeof fetch = fetch): Promise<MediaAsset> {
  const env = getPublicEnv();
  const body = new FormData();
  body.append("file", file);
  const headers = new Headers({ Accept: "application/json" });
  const token = readCsrfToken(browserCookieSource(), env.csrfCookieName);
  if (token) headers.set(env.csrfHeaderName, token);
  const response = await fetchImpl(new URL(backendContract.media.upload.path, env.apiBaseUrl), {
    method: "POST",
    headers,
    body,
    credentials: "include",
    redirect: "error",
  });
  const text = await response.text();
  let payload: unknown = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }
  if (!response.ok) throw apiErrorFromBody(response.status, payload);
  const asset = parseMediaAsset(payload);
  if (!asset) throw new ApiError({ status: 0, kind: "client", messages: [] });
  return asset;
}
