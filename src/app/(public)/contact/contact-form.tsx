"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import type { AppMessages } from "@/i18n/types";

export function ContactForm({ text }: { text: AppMessages["contact"] }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function send() {
    setPending(true);
    setMessage("");
    try {
      await apiFetch("/api/v1/contact", { method: "POST", body: { name, subject, body, email, phone } });
      setMessage(text.sent);
      setName("");
      setSubject("");
      setBody("");
      setEmail("");
      setPhone("");
    } catch {
      setMessage(text.failed);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="grid gap-3" onSubmit={(event) => event.preventDefault()}>
      <Input aria-label={text.name} value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} />
      <Input aria-label={text.email} type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={200} />
      <Input aria-label={text.phone} value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
      <Input aria-label={text.subject} value={subject} onChange={(event) => setSubject(event.target.value)} required maxLength={200} />
      <textarea aria-label={text.message} className="min-h-28 rounded-lg border p-2" value={body} onChange={(event) => setBody(event.target.value)} required maxLength={5000} />
      <Button type="button" disabled={pending} onClick={() => void send()}>{text.send}</Button>
      {message ? <p>{message}</p> : null}
    </form>
  );
}
