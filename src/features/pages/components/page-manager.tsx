"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormField } from "@/components/form/form-field";
import { FormSubmit } from "@/components/form/form-submit";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api-error";
import { revalidatePages } from "../actions";
import { useCopy } from "@/i18n/copy";
import type { AppMessages } from "@/i18n/types";
import { createPage, deletePage, fetchManagedPages, movePage, reorderPages, setPageStatus } from "../mutations";
import { pageCreateSchema, type PageCreateValues } from "../schemas";
import type { PageSummary } from "../types";

export function PageManager() {
  const pageMessages = useCopy("pages");
  const client = useQueryClient();
  const list = useQuery({ queryKey: ["pages", "admin"], queryFn: fetchManagedPages });
  const [creating, setCreating] = useState<string | null>(null);
  const [removing, setRemoving] = useState<PageSummary | null>(null);

  const refresh = async () => {
    const cache = await revalidatePages();
    await client.invalidateQueries({ queryKey: ["pages", "admin"] });
    if (!cache.ok) toast.error(pageMessages.unavailable);
  };

  const create = useMutation({
    mutationFn: createPage,
    onSuccess: async () => {
      toast.success(pageMessages.saved);
      setCreating(null);
      await refresh();
    },
    onError: (error) => toast.error(messageFor(error, pageMessages)),
  });
  const status = useMutation({
    mutationFn: ({ id, next }: { id: string; next: "DRAFT" | "PUBLISHED" }) => setPageStatus(id, next),
    onSuccess: async () => {
      toast.success(pageMessages.saved);
      await refresh();
    },
    onError: (error) => toast.error(messageFor(error, pageMessages)),
  });
  const move = useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) => movePage(id, parentId),
    onSuccess: () => refresh(),
    onError: (error) => toast.error(messageFor(error, pageMessages)),
  });

  const remove = useMutation({
    mutationFn: deletePage,
    onSuccess: async () => {
      toast.success(pageMessages.removed);
      setRemoving(null);
      await refresh();
    },
    onError: (error) => toast.error(messageFor(error, pageMessages)),
  });
  const reorder = useMutation({
    mutationFn: reorderPages,
    onSuccess: async () => {
      toast.success(pageMessages.reordered);
      await refresh();
    },
    onError: (error) => toast.error(messageFor(error, pageMessages)),
  });

  if (list.isPending) return <Skeleton className="h-40 w-full" />;
  if (list.isError) {
    return (
      <Alert>
        <AlertDescription>{messageFor(list.error, pageMessages)}</AlertDescription>
        <Button type="button" variant="outline" onClick={() => void list.refetch()}>
          {pageMessages.unavailable}
        </Button>
      </Alert>
    );
  }
  if (list.data.items.length === 0) return <Empty onCreate={() => setCreating("root")} creating={creating !== null} pending={create.isPending} onSubmit={(values) => create.mutateAsync(values)} onClose={() => setCreating(null)} />;

  return (
    <div className="grid gap-4">
      <Button type="button" className="w-fit" onClick={() => setCreating("root")}>
        {pageMessages.create}
      </Button>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{pageMessages.pageTitle}</TableHead>
            <TableHead>{pageMessages.slug}</TableHead>
            <TableHead>{pageMessages.status}</TableHead>
            <TableHead>{pageMessages.showInMenu}</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>{pageMessages.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.data.items.map((page, index) => (
            <TableRow key={page.id}>
              <TableCell className={page.parentId ? "pl-8" : undefined}>{page.title}</TableCell>
              <TableCell>{page.slug}</TableCell>
              <TableCell>
                <Badge>{page.status === "PUBLISHED" ? pageMessages.publishedStatus : pageMessages.draft}</Badge>
              </TableCell>
              <TableCell>{page.showInMenu ? pageMessages.showInMenu : pageMessages.hiddenFromMenu}</TableCell>
              <TableCell>{page.sortOrder}</TableCell>
              <TableCell className="flex flex-wrap gap-2">
                <Button nativeButton={false} variant="outline" size="sm" render={<Link href={`/admin/pages/${page.id}`} />}>
                  {pageMessages.edit}
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={index === 0 || reorder.isPending} onClick={() => reorder.mutate(swap(list.data.items, index, index - 1))}>
                  {pageMessages.moveUp}
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={index === list.data.items.length - 1 || reorder.isPending} onClick={() => reorder.mutate(swap(list.data.items, index, index + 1))}>
                  {pageMessages.moveDown}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => status.mutate({ id: page.id, next: page.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" })}>
                  {page.status === "PUBLISHED" ? pageMessages.unpublish : pageMessages.publish}
                </Button>
                {page.parentId ? null : (
                  <Button type="button" variant="outline" size="sm" onClick={() => setCreating(page.id)}>{pageMessages.addChild}</Button>
                )}
                <Select value={page.parentId ?? "root"} onValueChange={(value) => move.mutate({ id: page.id, parentId: value === "root" ? null : value })}>
                  <SelectTrigger className="w-36" aria-label={pageMessages.move}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">{pageMessages.move}</SelectItem>
                    {list.data.items.filter((item) => !item.parentId && item.id !== page.id).map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" disabled={page.isSystem} onClick={() => setRemoving(page)}>
                  {pageMessages.remove}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <CreateDialog open={creating !== null} pending={create.isPending} onClose={() => setCreating(null)} onSubmit={(values) => create.mutateAsync({ ...values, parentId: creating && creating !== "root" ? creating : null })} />
      <AlertDialog open={removing !== null} onOpenChange={(open) => { if (!open) setRemoving(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pageMessages.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{pageMessages.confirmDeleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{pageMessages.cancel}</AlertDialogCancel>
            <Button type="button" disabled={remove.isPending || !removing} onClick={() => removing && remove.mutate(removing.id)}>
              {pageMessages.remove}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Empty(props: { onCreate: () => void; creating: boolean; pending: boolean; onSubmit: (values: PageCreateValues) => Promise<unknown>; onClose: () => void }) {
  const pageMessages = useCopy("pages");
  return (
    <div className="grid gap-4">
      <p>{pageMessages.empty}</p>
      <Button type="button" className="w-fit" onClick={props.onCreate}>{pageMessages.create}</Button>
      <CreateDialog open={props.creating} pending={props.pending} onClose={props.onClose} onSubmit={props.onSubmit} />
    </div>
  );
}

function CreateDialog({ open, pending, onClose, onSubmit }: { open: boolean; pending: boolean; onClose: () => void; onSubmit: (values: PageCreateValues) => Promise<unknown> }) {
  const pageMessages = useCopy("pages");
  const form = useForm<PageCreateValues>({
    resolver: zodResolver(pageCreateSchema),
    defaultValues: { title: "", slug: "", templateKey: "blank", showInMenu: true },
  });
  const templateKey = useWatch({ control: form.control, name: "templateKey" });
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pageMessages.create}</DialogTitle>
        </DialogHeader>
        <Form form={form} onSubmit={onSubmit}>
          <fieldset className="grid gap-4" disabled={pending}>
          <FormField name="title" label={pageMessages.pageTitle} />
          <FormField name="slug" label={pageMessages.slug} />
          <label className="grid gap-1.5 text-sm font-medium">
            {pageMessages.template}
            <Select value={templateKey} onValueChange={(value) => form.setValue("templateKey", value === "home" ? "home" : "blank")}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="blank">{pageMessages.blank}</SelectItem>
                <SelectItem value="home">{pageMessages.home}</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <FormSubmit label={pageMessages.save} pendingLabel={pageMessages.saving} />
          </fieldset>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function swap(items: PageSummary[], from: number, to: number) {
  const next = items.map((item) => ({ id: item.id, sortOrder: item.sortOrder }));
  const current = next[from];
  const target = next[to];
  if (!current || !target) return next;
  const order = current.sortOrder;
  current.sortOrder = target.sortOrder;
  target.sortOrder = order;
  return next;
}

function messageFor(error: unknown, messages: AppMessages["pages"]): string {
  if (error instanceof ApiError && error.kind === "forbidden") return messages.forbiddenWrite;
  if (error instanceof ApiError && error.kind === "conflict") return messages.conflict;
  return messages.unavailable;
}
