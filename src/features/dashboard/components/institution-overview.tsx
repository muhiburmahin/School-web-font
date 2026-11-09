"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopy } from "@/i18n/copy";
import { fetchInstitutionSummary } from "../api";

export function InstitutionOverview() {
  const dashboard = useCopy("dashboard");
  const summary = useQuery({ queryKey: ["institution-dashboard"], queryFn: fetchInstitutionSummary });
  if (summary.isPending) return <Skeleton className="h-40 w-full" aria-label={dashboard.loading} />;
  if (summary.isError || !summary.data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{dashboard.unavailable}</AlertDescription>
      </Alert>
    );
  }
  const site = summary.data;
  const cards = [
    [dashboard.publishedPages, site.counts.publishedPages],
    [dashboard.draftPages, site.counts.draftPages],
    [dashboard.noticesCount, site.counts.notices],
    [dashboard.staffCount, site.counts.staff],
    [dashboard.albums, site.counts.albums],
    [dashboard.mediaCount, site.counts.media],
  ] as const;
  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{site.nameEn}</h1>
          <p className="text-sm text-muted-foreground">{site.nameBn}</p>
        </div>
        {site.website.publicUrl ? (
          <Button nativeButton={false} render={<a href={site.website.publicUrl} target="_blank" rel="noreferrer" />}>
            {dashboard.viewWebsite}
          </Button>
        ) : site.website.developmentPreviewPath ? (
          <Button nativeButton={false} render={<Link href={site.website.developmentPreviewPath} />}>
            {dashboard.viewPreview}
          </Button>
        ) : null}
      </div>
      <div id="website" className="grid gap-3 rounded-xl border bg-background p-4">
        <h2 className="text-lg font-medium">{dashboard.websiteStatus}</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">{dashboard.slug}</dt><dd>{site.siteSlug}</dd></div>
          <div><dt className="text-muted-foreground">{dashboard.type}</dt><dd>{site.institutionType ?? dashboard.none}</dd></div>
          <div><dt className="text-muted-foreground">{dashboard.level}</dt><dd>{site.level ?? dashboard.none}</dd></div>
          <div><dt className="text-muted-foreground">{dashboard.setup}</dt><dd>{site.onboardingStatus}</dd></div>
          <div><dt className="text-muted-foreground">{dashboard.verifiedHostname}</dt><dd>{site.website.verifiedHostnames.join(", ") || dashboard.none}</dd></div>
        </dl>
        <p>{site.website.provisioned ? dashboard.provisioned : dashboard.notProvisioned}</p>
        <p>{site.website.deploymentMode === "shared" ? dashboard.sharedMode : dashboard.dedicatedMode}</p>
        <p>{site.website.publicUrl ? site.website.publicUrl : dashboard.noPublicUrl}</p>
        {site.website.developmentPreviewPath ? <p>{dashboard.localPreview} {site.website.developmentPreviewPath}</p> : null}
        <p>{dashboard.hostingPending}</p>
        {site.website.unverifiedHostnames.length > 0 ? <p>{dashboard.unverifiedDomains} {site.website.unverifiedHostnames.join(", ")}</p> : null}
        {site.website.verifiedHostnames.length === 0 ? <p>{dashboard.noDomain}</p> : null}
        <p className="text-muted-foreground">{dashboard.logoNote}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold">{value}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {site.homePageId ? <Button nativeButton={false} variant="outline" render={<Link href={`/admin/pages/${site.homePageId}`} />}>{dashboard.editHome}</Button> : null}
        <Button nativeButton={false} variant="outline" render={<Link href="/admin/pages" />}>{dashboard.managePages}</Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/admin/theme" />}>{dashboard.updateBranding}</Button>
      </div>
      <div>
        <h2 className="text-lg font-medium">{dashboard.recentActivity}</h2>
        {site.activity.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{dashboard.noActivity}</p> : (
          <ul className="mt-2 grid gap-2 text-sm">
            {site.activity.map((item) => (
              <li key={item.id} className="rounded-md border bg-background px-3 py-2">
                <span className="font-medium">{item.action}</span>
                <span className="text-muted-foreground"> · {item.entityType} · {item.occurredAt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
