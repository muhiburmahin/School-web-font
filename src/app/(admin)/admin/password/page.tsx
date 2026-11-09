import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { authMessages } from "@/features/auth/messages";

export default function AdminPasswordPage() {
  return (
    <section className="grid max-w-md gap-4">
      <h1 className="text-2xl font-semibold">{authMessages.passwordSave}</h1>
      <ChangePasswordForm />
    </section>
  );
}
