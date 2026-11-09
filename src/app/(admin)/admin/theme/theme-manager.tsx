"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/api-client";
import type { AppMessages } from "@/i18n/types";

const presets = ["custom", "general", "school", "college", "madrasah", "technical", "coaching"] as const;
type Copy = AppMessages["theme"];

export function ThemeManager({ text }: { text: Copy }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [preset, setPreset] = useState<(typeof presets)[number]>("custom");
  const [primaryColor, setPrimaryColor] = useState("#1B4332");
  const [secondaryColor, setSecondaryColor] = useState("#D8F3DC");
  const [actionColor, setActionColor] = useState("#B45309");
  const [font, setFont] = useState("sans");
  const [header, setHeader] = useState("band");
  const [footer, setFooter] = useState("columns");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressEn, setAddressEn] = useState("");
  const [addressBn, setAddressBn] = useState("");

  useEffect(() => {
    let active = true;
    void apiFetch<Record<string, unknown>>("/api/v1/institution-profile")
      .then((row) => {
        if (!active || !row || typeof row !== "object") return;
        if (typeof row.primaryColor === "string") setPrimaryColor(row.primaryColor);
        if (typeof row.secondaryColor === "string") setSecondaryColor(row.secondaryColor);
        if (typeof row.actionColor === "string") setActionColor(row.actionColor);
        if (typeof row.font === "string") setFont(row.font);
        if (typeof row.header === "string") setHeader(row.header);
        if (typeof row.footer === "string") setFooter(row.footer);
        if (typeof row.preset === "string" && presets.includes(row.preset as (typeof presets)[number])) setPreset(row.preset as (typeof presets)[number]);
        if (typeof row.officialEmail === "string") setEmail(row.officialEmail);
        if (typeof row.officialPhone === "string") setPhone(row.officialPhone);
        if (typeof row.addressEn === "string") setAddressEn(row.addressEn);
        if (typeof row.addressBn === "string") setAddressBn(row.addressBn);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    setMessage("");
    try {
      await apiFetch("/api/v1/institution-profile", {
        method: "PATCH",
        body: {
          preset,
          ...(preset === "custom" ? { primaryColor, secondaryColor, actionColor } : {}),
          font,
          header,
          footer,
          officialEmail: email || null,
          officialPhone: phone || null,
          addressEn: addressEn || null,
          addressBn: addressBn || null,
        },
      });
      setMessage(text.saved);
    } catch (error) {
      setMessage(error instanceof ApiError ? text.unavailable : text.unavailable);
    }
  }

  if (state === "loading") return <p>{text.title}</p>;
  if (state === "error") return <p>{text.unavailable}</p>;
  return (
    <form className="grid max-w-xl gap-4" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <p className="text-sm text-muted-foreground">{text.preview}</p>
      <label className="grid gap-1 text-sm">{text.preset}
        <Select value={preset} onValueChange={(value) => { if (value && presets.includes(value as (typeof presets)[number])) setPreset(value as (typeof presets)[number]); }}>
          <SelectTrigger aria-label={text.preset}><SelectValue /></SelectTrigger>
          <SelectContent>{presets.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
      </label>
      <label className="grid gap-1 text-sm">{text.primary}<Input aria-label={text.primary} type="color" value={primaryColor} onChange={(event) => { setPreset("custom"); setPrimaryColor(event.target.value); }} /></label>
      <label className="grid gap-1 text-sm">{text.secondary}<Input aria-label={text.secondary} type="color" value={secondaryColor} onChange={(event) => { setPreset("custom"); setSecondaryColor(event.target.value); }} /></label>
      <label className="grid gap-1 text-sm">{text.action}<Input aria-label={text.action} type="color" value={actionColor} onChange={(event) => { setPreset("custom"); setActionColor(event.target.value); }} /></label>
      <label className="grid gap-1 text-sm">{text.font}
        <Select value={font} onValueChange={(value) => { if (value) setFont(value); }}>
          <SelectTrigger aria-label={text.font}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sans">sans</SelectItem>
            <SelectItem value="serif">serif</SelectItem>
            <SelectItem value="bangla">bangla</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-1 text-sm">{text.header}
        <Select value={header} onValueChange={(value) => { if (value) setHeader(value); }}>
          <SelectTrigger aria-label={text.header}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="band">band</SelectItem>
            <SelectItem value="compact">compact</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-1 text-sm">{text.footer}
        <Select value={footer} onValueChange={(value) => { if (value) setFooter(value); }}>
          <SelectTrigger aria-label={text.footer}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="columns">columns</SelectItem>
            <SelectItem value="simple">simple</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="grid gap-1 text-sm">{text.email}<Input aria-label={text.email} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label className="grid gap-1 text-sm">{text.phone}<Input aria-label={text.phone} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
      <label className="grid gap-1 text-sm">{text.address}<Input aria-label={text.address} value={addressEn} onChange={(event) => setAddressEn(event.target.value)} /></label>
      <label className="grid gap-1 text-sm">{text.addressBn}<Input aria-label={text.addressBn} value={addressBn} onChange={(event) => setAddressBn(event.target.value)} /></label>
      <div className="flex gap-3 rounded-lg border p-4" style={{ backgroundColor: secondaryColor, color: primaryColor }}>
        <span className="rounded-md px-3 py-2 text-white" style={{ backgroundColor: actionColor }}>{text.preview}</span>
      </div>
      <Button type="submit">{text.save}</Button>
      {message ? <p>{message}</p> : null}
    </form>
  );
}
