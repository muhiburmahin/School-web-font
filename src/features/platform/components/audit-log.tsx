"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAudit } from "../api";
import { useCopy } from "@/i18n/copy";
import type { AuditPage } from "../schemas";
import { notice } from "./institution-manager";

export function AuditLog() {
  const platformMessages = useCopy("platform");
  const [cursor, setCursor] = useState<string | null>(null);
  const [pages, setPages] = useState<AuditPage[]>([]);
  const query = useQuery({
    queryKey: ["platform", "audit", cursor],
    queryFn: () => fetchAudit(cursor),
  });

  if (query.isPending && pages.length === 0) return <Skeleton className="h-40 w-full" aria-label={platformMessages.loading} />;
  if (query.isError && pages.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{notice(query.error, platformMessages)}</AlertDescription>
      </Alert>
    );
  }

  const current = query.data;
  const items = [...pages.flatMap((page) => page.items), ...(current && !pages.some((page) => page === current) ? current.items : [])];
  const nextCursor = current?.nextCursor ?? null;

  return (
    <div className="grid gap-4">
      {items.length === 0 ? (
        <p>{platformMessages.emptyAudit}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{platformMessages.occurredAt}</TableHead>
              <TableHead>{platformMessages.action}</TableHead>
              <TableHead>{platformMessages.actor}</TableHead>
              <TableHead>{platformMessages.target}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.occurredAt}</TableCell>
                <TableCell>{item.action}</TableCell>
                <TableCell>{item.actorId}</TableCell>
                <TableCell>{item.institutionId}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {nextCursor ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (current) setPages((existing) => [...existing, current]);
            setCursor(nextCursor);
          }}
        >
          {platformMessages.loadMore}
        </Button>
      ) : null}
    </div>
  );
}
