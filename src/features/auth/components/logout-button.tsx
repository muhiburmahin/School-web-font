"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { logout } from "../api";

export function LogoutButton({ label = "Sign out" }: { label?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    try {
      await logout();
    } finally {
      queryClient.clear();
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <Button type="button" variant="outline" onClick={onLogout} disabled={pending}>
      {label}
    </Button>
  );
}
