"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { recordList, textOf } from "@/features/content/safe-url";
import type { AppMessages } from "@/i18n/types";

type Item = { id: string; labelBn: string; labelEn: string; sortOrder: number; isVisible: boolean; slug: string; pageId: string };

async function fetchNavigationItems(location: "HEADER" | "FOOTER"): Promise<Item[]> {
  const rows = recordList(await apiFetch<unknown>(`/api/v1/navigation/admin?location=${location}`));
  if (!rows) throw new Error("invalid");
  return rows.map((row) => ({
    id: textOf(row.id),
    labelBn: textOf(row.labelBn),
    labelEn: textOf(row.labelEn),
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
    isVisible: row.isVisible === true,
    slug: textOf(row.slug),
    pageId: textOf(row.pageId),
  }));
}

export function NavigationManager({ text, location }: { text: AppMessages["navigation"]; location: "HEADER" | "FOOTER" }) {
  const [items, setItems] = useState<Item[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetchNavigationItems(location)
      .then((data) => {
        if (!active) return;
        setItems(data);
        setState("ready");
      })
      .catch(() => {
        if (!active) return;
        setState("error");
      });
    return () => {
      active = false;
    };
  }, [location]);

  async function reload() {
    try {
      const data = await fetchNavigationItems(location);
      setItems(data);
      setState("ready");
    } catch {
      setState("error");
    }
  }

  function edit(id: string, patch: Partial<Item>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  async function save(item: Item) {
    setMessage("");
    try {
      await apiFetch(`/api/v1/navigation/${item.id}`, {
        method: "PATCH",
        body: { labelBn: item.labelBn, labelEn: item.labelEn, sortOrder: item.sortOrder, isVisible: item.isVisible, ...(item.pageId ? { pageId: item.pageId } : {}) },
      });
      setMessage(text.saved);
      await reload();
    } catch {
      setMessage(text.failed);
    }
  }

  return (
    <div className="grid gap-4">
      {state === "loading" || state === "error" ? <p>{text.unavailable}</p> : null}
      {state === "ready" && items.length === 0 ? <p>{text.empty}</p> : null}
      {items.map((item) => (
        <form key={item.id} className="grid gap-2 rounded-lg border p-3" onSubmit={(event) => event.preventDefault()}>
          <p className="text-sm text-muted-foreground">{item.slug}</p>
          <Input aria-label="labelBn" value={item.labelBn} onChange={(event) => edit(item.id, { labelBn: event.target.value })} maxLength={80} />
          <Input aria-label="labelEn" value={item.labelEn} onChange={(event) => edit(item.id, { labelEn: event.target.value })} maxLength={80} />
          <Input aria-label="order" type="number" value={item.sortOrder} onChange={(event) => edit(item.id, { sortOrder: Number(event.target.value) })} />
          <Input aria-label="page" value={item.pageId} placeholder={item.slug} onChange={(event) => edit(item.id, { pageId: event.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={item.isVisible} onChange={(event) => edit(item.id, { isVisible: event.target.checked })} />
            {text.visible}
          </label>
          <Button type="button" onClick={() => void save(item)}>{text.save}</Button>
        </form>
      ))}
      {message ? <p>{message}</p> : null}
    </div>
  );
}
