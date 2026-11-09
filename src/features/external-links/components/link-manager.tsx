"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, SafeLink } from "@/components/safe/safe-link";
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
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api-error";
import { revalidateExternalLinks } from "../actions";
import { useCopy } from "@/i18n/copy";
import type { AppMessages } from "@/i18n/types";
import {
  createExternalLink,
  deleteExternalLink,
  fetchManagedLinks,
  reorderExternalLinks,
  setExternalLinkActive,
  updateExternalLink,
} from "../mutations";
import { externalLinkPageHref, linkLabel, swapSortOrders, type ExternalLinkFormValues, type ExternalLinkQuery } from "../schemas";
import type { ExternalLink as ExternalLinkRecord } from "../types";
import { LinkForm } from "./link-form";

export function LinkManager({ query }: { query: ExternalLinkQuery }) {
  const externalLinkMessages = useCopy("externalLinks");
  const client = useQueryClient();
  const list = useQuery({
    queryKey: ["external-links", "admin", query.limit, query.cursor, query.category],
    queryFn: () => fetchManagedLinks(query),
  });
  const [editing, setEditing] = useState<ExternalLinkRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<ExternalLinkRecord | null>(null);

  async function refresh() {
    await client.invalidateQueries({ queryKey: ["external-links"] });
    await revalidateExternalLinks();
  }

  const save = useMutation({
    mutationFn: (values: ExternalLinkFormValues) => (editing ? updateExternalLink(editing.id, values) : createExternalLink(values)),
    onSuccess: async () => {
      toast.success(externalLinkMessages.saved);
      setCreating(false);
      setEditing(null);
      await refresh();
    },
  });
  const active = useMutation({
    mutationFn: (input: { id: string; isActive: boolean }) => setExternalLinkActive(input.id, input.isActive),
    onSuccess: async (_data, variables) => {
      toast.success(variables.isActive ? externalLinkMessages.activated : externalLinkMessages.deactivated);
      await refresh();
    },
    onError: (error) => toast.error(notice(error, externalLinkMessages)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteExternalLink(id),
    onSuccess: async () => {
      toast.success(externalLinkMessages.removed);
      setRemoving(null);
      await refresh();
    },
    onError: (error) => toast.error(notice(error, externalLinkMessages, true)),
  });
  const reorder = useMutation({
    mutationFn: reorderExternalLinks,
    onSuccess: async () => {
      toast.success(externalLinkMessages.reordered);
      await refresh();
    },
    onError: (error) => toast.error(notice(error, externalLinkMessages)),
  });

  if (list.isPending) return <Skeleton className="h-40 w-full" aria-label={externalLinkMessages.title} />;
  if (list.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{notice(list.error, externalLinkMessages)}</AlertDescription>
      </Alert>
    );
  }

  const items = list.data.items;
  const nextHref = list.data.nextCursor ? externalLinkPageHref("/admin/external-links", query, list.data.nextCursor) : null;

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex justify-end">
          <Button type="button" onClick={() => setCreating(true)}>{externalLinkMessages.create}</Button>
        </div>
        <Separator />
        {items.length === 0 ? <p className="text-sm text-muted-foreground">{externalLinkMessages.empty}</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{externalLinkMessages.labelEn}</TableHead>
                <TableHead>{externalLinkMessages.category}</TableHead>
                <TableHead>{externalLinkMessages.status}</TableHead>
                <TableHead>{externalLinkMessages.sortOrder}</TableHead>
                <TableHead>{externalLinkMessages.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell><ExternalLink href={item.url}>{linkLabel(item.labelEn) || externalLinkMessages.title}</ExternalLink></TableCell>
                  <TableCell>{externalLinkMessages.categories[item.category]}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.isActive ? "default" : "outline"}>{item.isActive ? externalLinkMessages.active : externalLinkMessages.inactive}</Badge>
                      <Switch
                        checked={item.isActive}
                        disabled={active.isPending}
                        aria-label={externalLinkMessages.status}
                        onCheckedChange={(checked) => active.mutate({ id: item.id, isActive: checked === true })}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger render={<Button type="button" size="sm" variant="outline" disabled={reorder.isPending} aria-label={externalLinkMessages.moveUp} onClick={() => move(items, index, -1)} />}>
                          {externalLinkMessages.moveUp}
                        </TooltipTrigger>
                        <TooltipContent>{externalLinkMessages.moveUp}</TooltipContent>
                      </Tooltip>
                      <Button type="button" size="sm" variant="outline" disabled={reorder.isPending} aria-label={externalLinkMessages.moveDown} onClick={() => move(items, index, 1)}>
                        {externalLinkMessages.moveDown}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button type="button" size="sm" variant="outline" aria-label={externalLinkMessages.actions} />}>
                        {externalLinkMessages.actions}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setEditing(item)}>{externalLinkMessages.edit}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRemoving(item)}>{externalLinkMessages.remove}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {nextHref ? <SafeLink href={nextHref}>{externalLinkMessages.next}</SafeLink> : null}
      </CardContent>
      <Dialog open={creating || editing !== null} onOpenChange={(open) => { if (!open) { setCreating(false); setEditing(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? externalLinkMessages.edit : externalLinkMessages.create}</DialogTitle>
          </DialogHeader>
          <LinkForm
            key={editing?.id ?? "new"}
            link={editing ?? undefined}
            pending={save.isPending}
            onCancel={() => { setCreating(false); setEditing(null); }}
            onSubmit={async (values) => {
              await save.mutateAsync(values);
            }}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog open={removing !== null} onOpenChange={(open) => { if (!open) setRemoving(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{externalLinkMessages.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>{externalLinkMessages.confirmDeleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>{externalLinkMessages.cancel}</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={remove.isPending} onClick={() => { if (removing) remove.mutate(removing.id); }}>
              {externalLinkMessages.remove}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );

  function move(rows: ExternalLinkRecord[], index: number, direction: -1 | 1) {
    const payload = swapSortOrders(rows, index, direction);
    if (payload) reorder.mutate(payload.items);
  }
}

function notice(error: unknown, messages: AppMessages["externalLinks"], conflict = false): string {
  if (error instanceof ApiError && error.kind === "forbidden") return messages.forbiddenWrite;
  if (conflict && error instanceof ApiError && error.kind === "conflict") return messages.conflict;
  if (error instanceof ApiError && error.kind === "not_found") return messages.notFound;
  return messages.unavailable;
}
