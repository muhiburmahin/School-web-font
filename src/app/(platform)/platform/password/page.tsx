import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { platformMessages } from "@/features/platform/messages";

export default function PlatformPasswordPage() {
  return (
    <section className="grid max-w-md gap-4">
      <h1 className="text-2xl font-semibold">{platformMessages.passwordTitle}</h1>
      <ChangePasswordForm />
    </section>
  );
}
