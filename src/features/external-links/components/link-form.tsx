"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormField } from "@/components/form/form-field";
import { FormSubmit } from "@/components/form/form-submit";
import { applyApiFieldErrors } from "@/components/form/apply-field-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api-error";
import { linkCategories } from "@/lib/validation/query";
import { useCopy } from "@/i18n/copy";
import { externalLinkFormSchema, type ExternalLinkFormValues } from "../schemas";
import type { ExternalLink } from "../types";

export function LinkForm({
  link,
  pending,
  onSubmit,
  onCancel,
}: {
  link?: ExternalLink;
  pending: boolean;
  onSubmit: (values: ExternalLinkFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const externalLinkMessages = useCopy("externalLinks");
  const fieldLabels = {
    labelBn: externalLinkMessages.labelInvalid,
    labelEn: externalLinkMessages.labelInvalid,
    url: externalLinkMessages.urlInvalid,
    category: externalLinkMessages.categoryInvalid,
    sortOrder: externalLinkMessages.sortInvalid,
  } as const;
  const form = useForm<ExternalLinkFormValues>({
    resolver: zodResolver(externalLinkFormSchema) as Resolver<ExternalLinkFormValues>,
    defaultValues: {
      labelBn: link?.labelBn ?? "",
      labelEn: link?.labelEn ?? "",
      url: link?.url ?? "",
      category: link?.category ?? "OTHER",
      sortOrder: link?.sortOrder ?? 0,
    },
  });
  const category = useWatch({ control: form.control, name: "category" });

  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        try {
          await onSubmit(values);
        } catch (error) {
          if (error instanceof ApiError && applyApiFieldErrors(error, form.setError, fieldLabels)) return;
          toast.error(error instanceof ApiError && error.kind === "forbidden" ? externalLinkMessages.forbiddenWrite : externalLinkMessages.unavailable);
        }
      }}
    >
      <FormField name="labelEn" label={externalLinkMessages.labelEn} />
      <FormField name="labelBn" label={externalLinkMessages.labelBn} />
      <FormField name="url" label={externalLinkMessages.url} type="url" />
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="category">
          {externalLinkMessages.category}
        </label>
        <Select
          value={category}
          onValueChange={(value) => form.setValue("category", value as ExternalLinkFormValues["category"], { shouldValidate: true })}
        >
          <SelectTrigger id="category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {linkCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {externalLinkMessages.categories[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <label className="text-sm font-medium" htmlFor="sortOrder">
          {externalLinkMessages.sortOrder}
        </label>
        <Input id="sortOrder" type="number" inputMode="numeric" aria-invalid={Boolean(form.formState.errors.sortOrder)} {...form.register("sortOrder", { valueAsNumber: true })} />
        {form.formState.errors.sortOrder?.message ? (
          <p className="text-sm text-destructive">{form.formState.errors.sortOrder.message}</p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <FormSubmit label={externalLinkMessages.save} pendingLabel={externalLinkMessages.saving} />
        <Button type="button" variant="outline" disabled={pending || form.formState.isSubmitting} onClick={onCancel}>
          {externalLinkMessages.cancel}
        </Button>
      </div>
    </Form>
  );
}
