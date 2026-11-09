"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormField } from "@/components/form/form-field";
import { FormSubmit } from "@/components/form/form-submit";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { backendContract } from "@/config/backend-contract";
import { ApiError } from "@/lib/api-error";
import { createInstitution, fetchInstitutions, reactivateInstitution, suspendInstitution, updateInstitution } from "../api";
import { useCopy } from "@/i18n/copy";
import type { AppMessages } from "@/i18n/types";
import {
  institutionCreateSchema,
  institutionFormSchema,
  type InstitutionCreateValues,
  type InstitutionFormValues,
  type InstitutionList,
} from "../schemas";

const levels = ["PRIMARY", "JUNIOR_SECONDARY", "SECONDARY", "HIGHER_SECONDARY", "SCHOOL_AND_COLLEGE", "MADRASAH", "TECHNICAL", "COLLEGE"] as const;

export function InstitutionManager() {
  const platformMessages = useCopy("platform");
  const client = useQueryClient();
  const [draft, setDraft] = useState({ q: "", status: "", institutionType: "" });
  const [filters, setFilters] = useState({ q: "", status: "", institutionType: "" });
  const [cursor, setCursor] = useState<string | null>(null);
  const list = useQuery({ queryKey: ["platform", "institutions", filters, cursor], queryFn: () => fetchInstitutions({ ...filters, cursor }) });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<InstitutionList["items"][number] | null>(null);
  const [suspending, setSuspending] = useState<InstitutionList["items"][number] | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (values: InstitutionFormValues | InstitutionCreateValues) =>
      editing ? updateInstitution(editing.id, values as InstitutionFormValues) : createInstitution(values as InstitutionCreateValues),
    onSuccess: async (result) => {
      const password = readTemporaryPassword(result);
      if (password) setTemporaryPassword(password);
      toast.success(password ? platformMessages.adminAdded : platformMessages.saved);
      setCreating(false);
      setEditing(null);
      await client.invalidateQueries({ queryKey: ["platform", "institutions"] });
    },
    onError: (error) => toast.error(notice(error, platformMessages)),
  });
  const status = useMutation({
    mutationFn: (row: InstitutionList["items"][number]) =>
      row.status === "SUSPENDED" ? reactivateInstitution(row.id) : suspendInstitution(row.id),
    onSuccess: async (_data, row) => {
      toast.success(row.status === "SUSPENDED" ? platformMessages.reactivated : platformMessages.suspended);
      setSuspending(null);
      await client.invalidateQueries({ queryKey: ["platform", "institutions"] });
    },
    onError: (error) => toast.error(notice(error, platformMessages)),
  });

  if (list.isPending) return <Skeleton className="h-40 w-full" aria-label={platformMessages.loading} />;
  if (list.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{notice(list.error, platformMessages)}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4">
      <form className="flex flex-wrap items-end gap-2" onSubmit={(event) => { event.preventDefault(); setCursor(null); setFilters(draft); }}>
        <label className="grid gap-1 text-sm">
          {platformMessages.search}
          <Input value={draft.q} onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))} maxLength={80} />
        </label>
        <label className="grid gap-1 text-sm">
          {platformMessages.status}
          <select className="h-9 rounded-md border bg-background px-2" aria-label={platformMessages.status} value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
            <option value="">{platformMessages.allStatuses}</option>
            <option value="ACTIVE">{platformMessages.active}</option>
            <option value="SUSPENDED">{platformMessages.suspendedStatus}</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          {platformMessages.type}
          <select className="h-9 rounded-md border bg-background px-2" aria-label={platformMessages.type} value={draft.institutionType} onChange={(event) => setDraft((current) => ({ ...current, institutionType: event.target.value }))}>
            <option value="">{platformMessages.allTypes}</option>
            {["SCHOOL", "COLLEGE", "SCHOOL_AND_COLLEGE", "MADRASAH", "TECHNICAL_INSTITUTE", "COACHING_CENTER", "TRAINING_CENTER", "OTHER"].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <Button type="submit">{platformMessages.searchAction}</Button>
      </form>
      <div>
        <Button type="button" onClick={() => { setEditing(null); setCreating(true); }}>
          {platformMessages.create}
        </Button>
      </div>
      {temporaryPassword ? (
        <Alert>
          <AlertDescription>
            {platformMessages.temporaryPassword}: {temporaryPassword}
          </AlertDescription>
        </Alert>
      ) : null}
      {list.data.items.length === 0 ? (
        <p>{platformMessages.empty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{platformMessages.nameEn}</TableHead>
              <TableHead>{platformMessages.nameBn}</TableHead>
              <TableHead>{platformMessages.siteSlug}</TableHead>
              <TableHead>{platformMessages.type}</TableHead>
              <TableHead>{platformMessages.created}</TableHead>
              <TableHead>{platformMessages.domain}</TableHead>
              <TableHead>{platformMessages.onboarding}</TableHead>
              <TableHead>{platformMessages.status}</TableHead>
              <TableHead>{platformMessages.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/platform/institutions/${item.id}#domains`}>{item.nameEn ?? item.id}</Link>
                </TableCell>
                <TableCell>{item.nameBn}</TableCell>
                <TableCell>{item.siteSlug}</TableCell>
                <TableCell>{item.institutionType ?? platformMessages.none}</TableCell>
                <TableCell>{item.createdAt.slice(0, 10)}</TableCell>
                <TableCell>
                  {item.publicUrl ? <a href={item.publicUrl}>{item.publicUrl}</a> : item.developmentPreviewPath ? <Link href={item.developmentPreviewPath}>{platformMessages.viewPreview}</Link> : item.domains?.map((domain) => domain.hostname).join(", ") || platformMessages.noUrl}
                </TableCell>
                <TableCell>{onboardingText(item.onboardingStatus, platformMessages)}</TableCell>
                <TableCell>
                  <Badge variant={item.status === "ACTIVE" ? "default" : "secondary"}>
                    {item.status === "ACTIVE" ? platformMessages.active : platformMessages.suspendedStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button nativeButton={false} size="sm" render={<Link href={`/platform/institutions/${item.id}#domains`} />}>
                      {platformMessages.manageDomain}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button type="button" size="sm" variant="outline" aria-label={platformMessages.actions} />}>
                        {platformMessages.actions}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem render={<Link href={`/platform/institutions/${item.id}#domains`} />}>{platformMessages.manageDomain}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditing(item)}>{platformMessages.edit}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSuspending(item)}>
                          {item.status === "SUSPENDED" ? platformMessages.reactivate : platformMessages.suspend}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <div className="flex gap-2">
        {cursor ? <Button type="button" variant="outline" onClick={() => setCursor(null)}>{platformMessages.cancel}</Button> : null}
        {list.data?.nextCursor ? <Button type="button" variant="outline" onClick={() => setCursor(list.data?.nextCursor ?? null)}>{platformMessages.loadMore}</Button> : null}
      </div>
      <Dialog
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? platformMessages.edit : platformMessages.create}</DialogTitle>
          </DialogHeader>
          {editing ? (
            <InstitutionForm key={editing.id} initial={editing} onSubmit={(values) => { save.mutate(values); }} />
          ) : (
            <CreateInstitutionForm key="new" onSubmit={(values) => { save.mutate(values); }} />
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={suspending !== null} onOpenChange={(open) => { if (!open) setSuspending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{suspending?.status === "SUSPENDED" ? platformMessages.confirmReactivate : platformMessages.confirmSuspend}</AlertDialogTitle>
            <AlertDialogDescription>
              {suspending?.status === "SUSPENDED" ? platformMessages.confirmReactivateBody : platformMessages.confirmSuspendBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{platformMessages.cancel}</AlertDialogCancel>
            <Button type="button" disabled={status.isPending} onClick={() => suspending && status.mutate(suspending)}>
              {suspending?.status === "SUSPENDED" ? platformMessages.reactivate : platformMessages.suspend}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateInstitutionForm({ onSubmit }: { onSubmit: (values: InstitutionCreateValues) => void | Promise<unknown> }) {
  const platformMessages = useCopy("platform");
  const form = useForm<InstitutionCreateValues>({
    resolver: zodResolver(institutionCreateSchema(platformMessages)) as Resolver<InstitutionCreateValues>,
    defaultValues: { nameBn: "", nameEn: "", siteSlug: "", adminEmail: "", adminDisplayName: "" },
  });
  const level = useWatch({ control: form.control, name: "level" });
  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormField name="nameEn" label={platformMessages.nameEn} />
      <FormField name="nameBn" label={platformMessages.nameBn} />
      <FormField name="siteSlug" label={platformMessages.siteSlug} autoComplete="off" />
      <p className="text-sm text-muted-foreground">{platformMessages.siteSlugHint}</p>
      <FormField name="adminEmail" label={platformMessages.email} type="email" autoComplete="off" />
      <FormField name="adminDisplayName" label={platformMessages.displayName} autoComplete="off" />
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="level">
          {platformMessages.level}
        </label>
        <Select value={level ?? ""} onValueChange={(value) => form.setValue("level", value as InstitutionCreateValues["level"])}>
          <SelectTrigger id="level" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {levels.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <FormSubmit label={platformMessages.save} pendingLabel={platformMessages.saving} />
    </Form>
  );
}

function InstitutionForm({
  initial,
  onSubmit,
}: {
  initial: InstitutionList["items"][number] | null;
  onSubmit: (values: InstitutionFormValues) => void | Promise<unknown>;
}) {
  const platformMessages = useCopy("platform");
  const form = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionFormSchema) as Resolver<InstitutionFormValues>,
    defaultValues: {
      nameBn: initial?.nameBn ?? "",
      nameEn: initial?.nameEn ?? "",
      level: (levels as readonly string[]).includes(initial?.level ?? "") ? (initial?.level as InstitutionFormValues["level"]) : undefined,
    },
  });
  const level = useWatch({ control: form.control, name: "level" });
  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormField name="nameEn" label={platformMessages.nameEn} />
      <FormField name="nameBn" label={platformMessages.nameBn} />
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="level">
          {platformMessages.level}
        </label>
        <Select value={level ?? ""} onValueChange={(value) => form.setValue("level", value as InstitutionFormValues["level"])}>
          <SelectTrigger id="level" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {levels.map((level) => (
              <SelectItem key={level} value={level}>
                {level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <FormSubmit label={platformMessages.save} pendingLabel={platformMessages.saving} />
    </Form>
  );
}

function readTemporaryPassword(result: unknown): string | null {
  if (!result || typeof result !== "object" || !("admin" in result)) return null;
  const admin = result.admin;
  if (!admin || typeof admin !== "object" || !("temporaryPassword" in admin)) return null;
  return typeof admin.temporaryPassword === "string" ? admin.temporaryPassword : null;
}

export function onboardingText(status: string | undefined, messages: AppMessages["platform"]): string {
  if (status === "PENDING_SETUP") return messages.onboardingPending;
  if (status === "READY") return messages.onboardingReady;
  if (status === "NEEDS_REVIEW") return messages.onboardingReview;
  return "";
}

export function notice(error: unknown, messages: AppMessages["platform"]): string {
  if (error instanceof ApiError && (error.kind === "forbidden" || error.status === 403)) return messages.forbidden;
  if (error instanceof ApiError && error.kind === "conflict" && error.messages.includes(backendContract.slugUsedMessage)) {
    return messages.slugConflict;
  }
  if (error instanceof ApiError && error.kind === "conflict" && error.messages.includes(backendContract.emailUsedMessage)) {
    return messages.emailConflict;
  }
  if (error instanceof ApiError && error.kind === "conflict" && error.messages.includes(backendContract.hostnameUsedMessage)) {
    return messages.hostnameConflict;
  }
  if (error instanceof ApiError && error.kind === "conflict") return messages.conflict;
  if (error instanceof ApiError && error.kind === "validation" && error.messages.includes(backendContract.hostnameInvalidMessage)) {
    return messages.domainInvalid;
  }
  if (error instanceof ApiError && error.kind === "validation") return messages.formInvalid;
  return messages.unavailable;
}
