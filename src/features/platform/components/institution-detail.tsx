"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormField } from "@/components/form/form-field";
import { FormSubmit } from "@/components/form/form-submit";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { addInstitutionDomain, assignPlatformSubdomain, createInstitutionAdmin, fetchInstitution, markInstitutionReady, removeInstitutionDomain, repairStarterSite, retryDomainChallenge, setDomainRouting, setInstitutionAdminStatus, setPrimaryDomain, verifyInstitutionDomain } from "../api";
import { useCopy } from "@/i18n/copy";
import { adminFormSchema, type AdminFormValues } from "../schemas";
import { notice, onboardingText } from "./institution-manager";

export function InstitutionDetail({ institutionId }: { institutionId: string }) {
  const platformMessages = useCopy("platform");
  const client = useQueryClient();
  const detail = useQuery({ queryKey: ["platform", "institution", institutionId], queryFn: () => fetchInstitution(institutionId) });
  const [open, setOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [hostname, setHostname] = useState("");
  const [message, setMessage] = useState("");
  const [challenge, setChallenge] = useState<{ host: string; value: string; expiresAt: string } | null>(null);
  const add = useMutation({
    mutationFn: (values: AdminFormValues) => createInstitutionAdmin(institutionId, values),
    onSuccess: async (created) => {
      setTemporaryPassword(created.temporaryPassword);
      setOpen(false);
      toast.success(platformMessages.adminAdded);
      await client.invalidateQueries({ queryKey: ["platform", "institution", institutionId] });
    },
    onError: (error) => toast.error(notice(error, platformMessages)),
  });

  async function run(action: () => Promise<unknown>, saved: string) {
    try {
      await action();
      setMessage(saved);
      await client.invalidateQueries({ queryKey: ["platform", "institution", institutionId] });
    } catch (error) {
      const text = notice(error, platformMessages);
      setMessage(text);
      toast.error(text);
    }
  }

  if (detail.isPending) return <Skeleton className="h-40 w-full" aria-label={platformMessages.loading} />;
  if (detail.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{notice(detail.error, platformMessages)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <Link className="text-sm text-primary underline-offset-4 hover:underline" href="/platform">{platformMessages.backToInstitutions}</Link>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{detail.data.nameEn}</h1>
        <Badge>{detail.data.status === "ACTIVE" ? platformMessages.active : platformMessages.suspendedStatus}</Badge>
      </div>
      <p>{detail.data.nameBn}</p>
      {detail.data.siteSlug ? <p>{platformMessages.siteSlug}: {detail.data.siteSlug}</p> : null}
      {detail.data.institutionType ? <p>{platformMessages.type}: {detail.data.institutionType}</p> : null}
      <p>{platformMessages.onboarding}: {onboardingText(detail.data.onboardingStatus, platformMessages)}</p>
      {detail.data.publicUrl ? <p><a href={detail.data.publicUrl}>{platformMessages.viewWebsite}</a></p> : null}
      {detail.data.developmentPreviewPath ? (
        <p>
          <Link href={detail.data.developmentPreviewPath}>{platformMessages.viewPreview}</Link>
          <span className="mt-1 block text-sm text-muted-foreground">{platformMessages.localPreview}</span>
        </p>
      ) : null}
      {detail.data.publicUrl ? null : <p>{platformMessages.websitePending}</p>}
      <Button type="button" variant="outline" onClick={() => void run(() => repairStarterSite(institutionId), platformMessages.repaired)}>{platformMessages.repairStarter}</Button>
      {detail.data.onboardingStatus !== "READY" ? (
        <Button type="button" variant="outline" onClick={() => void run(() => markInstitutionReady(institutionId), platformMessages.readySaved)}>{platformMessages.markReady}</Button>
      ) : null}
      <section id="domains" className="grid scroll-mt-24 gap-3 rounded-lg border p-4">
      <h2 className="text-lg font-medium">{platformMessages.domainTitle}</h2>
      <p className="text-sm text-muted-foreground">{platformMessages.domainIntro}</p>
      <p className="text-sm text-muted-foreground">{platformMessages.verifyHint}</p>
      <p className="text-sm text-muted-foreground">{platformMessages.dnsNote}</p>
      <p>{platformMessages.platformSubdomain}: {detail.data.platformSubdomain ?? platformMessages.subdomainMissing}</p>
      {detail.data.platformBaseDomain ? <Button type="button" variant="outline" onClick={() => void run(() => assignPlatformSubdomain(institutionId), platformMessages.domainSaved)}>{platformMessages.assignSubdomain}</Button> : null}
      {detail.data.domains.length === 0 ? <p>{platformMessages.noDomainYet}</p> : null}
      <ul className="grid gap-2">
        {detail.data.domains.map((domain) => (
          <li key={domain.id} className="grid gap-2 rounded-lg border p-3">
            <span className="font-medium">{domain.hostname}</span>
            <span className="text-sm text-muted-foreground">
              {domain.verifiedAt ? `${platformMessages.verified}: ${domain.verifiedAt}` : platformMessages.pending}
              {domain.isPrimary ? ` · ${platformMessages.primary}` : ""}
              {domain.routingEnabled ? ` · ${platformMessages.routingOn}` : ` · ${platformMessages.routingOff}`}
            </span>
            <div className="flex flex-wrap gap-2">
              {domain.verifiedAt ? null : <Button type="button" variant="outline" onClick={() => void run(() => verifyInstitutionDomain(institutionId, domain.id), platformMessages.domainSaved)}>{platformMessages.verifyDomain}</Button>}
              {domain.verifiedAt || !domain.challengePending ? null : <Button type="button" variant="outline" onClick={() => void run(async () => { setChallenge(await retryDomainChallenge(institutionId, domain.id)); }, platformMessages.domainSaved)}>{platformMessages.retryChallenge}</Button>}
              {domain.verifiedAt && domain.routingEnabled && !domain.isPrimary ? <Button type="button" variant="outline" onClick={() => void run(() => setPrimaryDomain(institutionId, domain.id), platformMessages.domainSaved)}>{platformMessages.makePrimary}</Button> : null}
              {domain.routingEnabled ? <Button type="button" variant="outline" onClick={() => void run(() => setDomainRouting(institutionId, domain.id, false), platformMessages.domainSaved)}>{platformMessages.disableDomain}</Button> : null}
              {domain.verifiedAt && !domain.routingEnabled ? <Button type="button" variant="outline" onClick={() => void run(() => setDomainRouting(institutionId, domain.id, true), platformMessages.domainSaved)}>{platformMessages.enableDomain}</Button> : null}
              <Button type="button" variant="outline" onClick={() => { if (window.confirm(platformMessages.confirmRemove)) void run(() => removeInstitutionDomain(institutionId, domain.id, domain.isPrimary === true), platformMessages.domainSaved); }}>{platformMessages.removeDomain}</Button>
            </div>
          </li>
        ))}
      </ul>
      <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => event.preventDefault()}>
        <label className="grid gap-1 text-sm">
          {platformMessages.customDomainLabel}
          <Input aria-label={platformMessages.customDomainLabel} value={hostname} onChange={(event) => setHostname(event.target.value)} placeholder="school.edu.bd" maxLength={253} />
        </label>
        <Button type="button" onClick={() => void run(async () => { setChallenge(await addInstitutionDomain(institutionId, hostname)); setHostname(""); }, platformMessages.domainSaved)}>{platformMessages.addDomain}</Button>
      </form>
      {challenge ? <p className="text-sm">{platformMessages.challengeRecord} TXT {challenge.host} = {challenge.value} ({challenge.expiresAt})</p> : null}
      {message ? <p>{message}</p> : null}
      </section>
      {temporaryPassword ? (
        <Alert>
          <AlertDescription>
            {platformMessages.temporaryPassword}: {temporaryPassword}
          </AlertDescription>
        </Alert>
      ) : null}
      <div>
        <Button type="button" onClick={() => setOpen(true)}>
          {platformMessages.addAdmin}
        </Button>
      </div>
      <h2 className="text-lg font-medium">{platformMessages.admins}</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{platformMessages.displayName}</TableHead>
            <TableHead>{platformMessages.email}</TableHead>
            <TableHead>{platformMessages.status}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {detail.data.admins.map((admin) => (
            <TableRow key={admin.id}>
              <TableCell>{admin.displayName}</TableCell>
              <TableCell>{admin.email}</TableCell>
              <TableCell>{admin.status}</TableCell>
              <TableCell>
                <Button type="button" variant="outline" onClick={() => void run(() => setInstitutionAdminStatus(institutionId, admin.id, admin.status === "DISABLED" ? "ACTIVE" : "DISABLED"), platformMessages.readySaved)}>
                  {admin.status === "DISABLED" ? platformMessages.enableAdmin : platformMessages.disableAdmin}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{platformMessages.addAdmin}</DialogTitle>
          </DialogHeader>
          <AdminForm onSubmit={(values) => add.mutateAsync(values)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminForm({ onSubmit }: { onSubmit: (values: AdminFormValues) => Promise<unknown> }) {
  const platformMessages = useCopy("platform");
  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminFormSchema) as Resolver<AdminFormValues>,
    defaultValues: { email: "", displayName: "" },
  });
  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormField name="email" label={platformMessages.email} type="email" />
      <FormField name="displayName" label={platformMessages.displayName} />
      <FormSubmit label={platformMessages.save} pendingLabel={platformMessages.saving} />
    </Form>
  );
}
