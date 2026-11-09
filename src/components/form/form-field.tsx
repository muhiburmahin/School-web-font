"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FormField({
  name,
  label,
  type = "text",
  autoComplete,
  inputMode,
  revealLabel,
  hideLabel,
  hint,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  revealLabel?: string;
  hideLabel?: string;
  hint?: string;
}) {
  const { register, formState } = useFormContext();
  const [visible, setVisible] = useState(false);
  const error = formState.errors[name];
  const message = typeof error?.message === "string" ? error.message : null;
  const describedBy = [message ? `${name}-error` : null, hint ? `${name}-hint` : null].filter(Boolean).join(" ") || undefined;
  const inputType = type === "password" && visible ? "text" : type;

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
      </label>
      <div className="flex gap-2">
      <Input
        id={name}
        type={inputType}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(message)}
        aria-describedby={describedBy}
        {...register(name)}
      />
      {type === "password" && revealLabel && hideLabel ? (
        <Button type="button" variant="outline" aria-pressed={visible} onClick={() => setVisible((current) => !current)}>
          {visible ? hideLabel : revealLabel}
        </Button>
      ) : null}
      </div>
      {hint ? <p className="text-sm text-muted-foreground" id={`${name}-hint`}>{hint}</p> : null}
      {message ? (
        <p className="text-sm text-destructive" id={`${name}-error`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
