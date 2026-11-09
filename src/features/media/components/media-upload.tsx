"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";
import { useCopy } from "@/i18n/copy";
import type { AppMessages } from "@/i18n/types";
import { uploadMedia } from "../upload";
import type { MediaAsset } from "../types";

const maxBytes = 5 * 1024 * 1024;
const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function MediaUpload({ onUploaded }: { onUploaded?: (asset: MediaAsset) => void }) {
  const messages = useCopy("media");
  const router = useRouter();
  const client = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(next: File) {
    if (!allowed.has(next.type) || next.size < 1 || next.size > maxBytes) {
      setError(messages.uploadInvalid);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const asset = await uploadMedia(next);
      setFile(null);
      await client.invalidateQueries({ queryKey: ["pages", "media"] });
      router.refresh();
      onUploaded?.(asset);
    } catch (caught) {
      setError(notice(caught, messages));
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (file) void send(file);
      }}
    >
      <label className="grid gap-1 text-sm">
        {messages.upload}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={pending}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setError(null);
          }}
        />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || !file}>{pending ? messages.uploading : messages.upload}</Button>
        {error && file ? (
          <Button type="button" variant="outline" disabled={pending} onClick={() => void send(file)}>{messages.retry}</Button>
        ) : null}
      </div>
    </form>
  );
}

function notice(error: unknown, messages: AppMessages["media"]): string {
  if (!(error instanceof ApiError)) return messages.unavailable;
  if (error.status === 400) return messages.uploadInvalid;
  if (error.status === 401 || error.status === 403) return messages.forbidden;
  if (error.status === 501) return messages.changesUnavailable;
  return messages.unavailable;
}
