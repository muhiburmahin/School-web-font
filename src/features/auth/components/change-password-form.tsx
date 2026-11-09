"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormField } from "@/components/form/form-field";
import { FormSubmit } from "@/components/form/form-submit";
import { backendContract } from "@/config/backend-contract";
import { ApiError } from "@/lib/api-error";
import { apiFetch } from "@/lib/api-client";
import { useCopy } from "@/i18n/copy";

const schema = z.object({ password: z.string().min(12).max(200) });
type Values = z.infer<typeof schema>;

export function ChangePasswordForm() {
  const authMessages = useCopy("auth");
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: { password: "" },
  });
  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        try {
          await apiFetch(backendContract.auth.password.path, { method: "POST", body: values });
          toast.success(authMessages.passwordSaved);
          router.push("/login");
          router.refresh();
        } catch (error) {
          toast.error(error instanceof ApiError && error.kind === "forbidden" ? authMessages.forbidden : authMessages.unavailable);
        }
      }}
    >
      <FormField name="password" label={authMessages.passwordLabel} type="password" autoComplete="new-password" />
      <FormSubmit label={authMessages.passwordSave} pendingLabel={authMessages.passwordSaving} />
    </Form>
  );
}
