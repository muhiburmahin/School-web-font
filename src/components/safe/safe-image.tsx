"use client";

import { useState } from "react";
import { safeHttpUrl } from "@/lib/validation/url";

export function SafeImage({ src, alt, fallback, className }: { src: string | null; alt: string; fallback: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const url = safeHttpUrl(src);
  if (!url || failed) {
    return <span className="text-sm text-muted-foreground">{fallback}</span>;
  }
  return (
    // Hosts are not known at build time, so this is a plain image with a load fallback.
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className ?? "h-16 w-16 rounded-md object-cover"} src={url} alt={alt} onError={() => setFailed(true)} />
  );
}
