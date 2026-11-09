"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { recordList, textOf } from "@/features/content/safe-url";
import type { AppMessages } from "@/i18n/types";

type Row = { id: string; name: string; subject: string; status: string };
type Detail = { body: string; email: string; phone: string };

export function ContactInbox({ text }: { text: AppMessages["contact"] }) {
  const [items, setItems] = useState<Row[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const rows = recordList(await apiFetch<unknown>("/api/v1/contact"));
        if (!rows) throw new Error("invalid");
        setItems(rows.map((row) => ({ id: textOf(row.id), name: textOf(row.name), subject: textOf(row.subject), status: textOf(row.status) })));
        setState("ready");
      } catch {
        setState("error");
      }
    })();
  }, []);

  async function open(id: string) {
    setMessage("");
    try {
      const row = await apiFetch<unknown>(`/api/v1/contact/${id}`);
      if (!row || typeof row !== "object") throw new Error("invalid");
      const data = row as { body?: unknown; email?: unknown; phone?: unknown };
      setDetail({ body: textOf(data.body), email: textOf(data.email), phone: textOf(data.phone) });
    } catch {
      setMessage(text.failed);
    }
  }

  return (
    <div className="grid gap-4">
      {state === "loading" || state === "error" ? <p>{text.unavailable}</p> : null}
      {state === "ready" && items.length === 0 ? <p>{text.empty}</p> : null}
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between rounded-lg border p-3">
            <span>{item.name} · {item.subject} · {item.status}</span>
            <Button type="button" variant="outline" onClick={() => void open(item.id)}>{text.message}</Button>
          </li>
        ))}
      </ul>
      {detail ? <article className="rounded-lg border p-4"><p>{detail.email}</p><p>{detail.phone}</p><p className="mt-2 whitespace-pre-wrap">{detail.body}</p></article> : null}
      {message ? <p>{message}</p> : null}
    </div>
  );
}
