"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useCopy } from "@/i18n/copy";

export function ThemeToggle({ className }: { className?: string }) {
  const nav = useCopy("nav");
  const { setTheme } = useTheme();
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={className}
      aria-label={nav.theme}
      onClick={() => setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  );
}
