"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/i18n/copy";
import { setLocale } from "@/i18n/locale";

export function LanguageToggle({ className }: { className?: string }) {
  const nav = useCopy("nav");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locale === "en" ? "bn" : "en";
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={className}
      aria-label={nav.language}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        });
      }}
    >
      {locale === "bn" ? "EN" : "বাং"}
    </Button>
  );
}
