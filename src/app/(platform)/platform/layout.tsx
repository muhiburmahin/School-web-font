import { Suspense } from "react";
import { ErrorBox } from "@/components/common/error-box";
import { LoadingSkeleton } from "@/components/common/loading-skeleton";
import { PlatformShell } from "@/components/layout/platform-shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { copy } from "@/i18n/server-copy";
import { canReadPlatform } from "@/features/platform/schemas";
import { verifySession } from "@/lib/auth/dal";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSkeleton label="…" />}>
      <PlatformGate>{children}</PlatformGate>
    </Suspense>
  );
}

async function PlatformGate({ children }: { children: React.ReactNode }) {
  const [session, platformMessages, auth] = await Promise.all([verifySession(), copy("platform"), copy("auth")]);
  const allowed = session.status === "authenticated" && canReadPlatform(session.user.permissions);
  return (
    <RequireAuth session={session} messages={auth}>
      {allowed && session.status === "authenticated" ? (
        <TooltipProvider>
          <PlatformShell user={session.user}>{children}</PlatformShell>
          <Toaster />
        </TooltipProvider>
      ) : (
        <ErrorBox message={platformMessages.forbidden} />
      )}
    </RequireAuth>
  );
}
