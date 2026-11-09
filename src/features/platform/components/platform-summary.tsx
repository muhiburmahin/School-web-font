"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopy } from "@/i18n/copy";
import { fetchPlatformSummary } from "../api";

export function PlatformSummary() {
  const platformMessages = useCopy("platform");
  const summary = useQuery({ queryKey: ["platform", "summary"], queryFn: fetchPlatformSummary });
  if (summary.isPending) return <Skeleton className="h-24 w-full" aria-label={platformMessages.loading} />;
  if (summary.isError || !summary.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{platformMessages.unavailable}</AlertDescription>
      </Alert>
    );
  }
  const cards = [
    [platformMessages.total, summary.data.total],
    [platformMessages.activeCount, summary.data.active],
    [platformMessages.pendingCount, summary.data.pendingSetup],
    [platformMessages.suspendedCount, summary.data.suspended],
    [platformMessages.verifiedCount, summary.data.withVerifiedDomain],
    [platformMessages.noHostnameCount, summary.data.withoutVerifiedDomain],
  ] as const;
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-medium">{platformMessages.summaryTitle}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{value}</p></CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{platformMessages.websitePending}</p>
    </section>
  );
}
