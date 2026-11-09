import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { AdminShell } from "@/components/layout/admin-shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { copy } from "@/i18n/server-copy";
import { verifySession } from "@/lib/auth/dal";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton label="…" />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  const [session, auth] = await Promise.all([verifySession(), copy("auth")]);
  const platformOnly = session.status === "authenticated" && session.user.roles.includes("SUPER_ADMIN") && !session.user.roles.includes("SITE_ADMIN");
  if (platformOnly) redirect("/platform");
  return (
    <RequireAuth session={session} messages={auth}>
      {session.status === "authenticated" ? (
        <TooltipProvider>
          <AdminShell user={session.user}>{children}</AdminShell>
          <Toaster />
        </TooltipProvider>
      ) : null}
    </RequireAuth>
  );
}
