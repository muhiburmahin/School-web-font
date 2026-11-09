"use client";

import { Button } from "@/components/ui/button";

export function Pagination({
  nextCursor,
  onNext,
}: {
  nextCursor: string | null;
  onNext: (cursor: string) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button type="button" variant="outline" disabled={!nextCursor} onClick={() => nextCursor && onNext(nextCursor)}>
        Next
      </Button>
    </div>
  );
}
