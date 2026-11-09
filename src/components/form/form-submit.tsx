"use client";

import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";

export function FormSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { formState } = useFormContext();
  return (
    <Button type="submit" disabled={formState.isSubmitting}>
      {formState.isSubmitting ? pendingLabel : label}
    </Button>
  );
}
