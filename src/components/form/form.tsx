"use client";

import { FormProvider, type FieldValues, type SubmitHandler, type UseFormReturn } from "react-hook-form";

export function Form<T extends FieldValues>({
  form,
  onSubmit,
  children,
}: {
  form: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: React.ReactNode;
}) {
  return (
    <FormProvider {...form}>
      <form className="grid gap-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
        {children}
      </form>
    </FormProvider>
  );
}
