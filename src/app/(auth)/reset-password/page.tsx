import { redirect } from "next/navigation";

// Self-service reset tokens were removed (they could not be delivered or stored safely).
// Passwords are reset by platform support, who issue a one-time temporary password.
export default function ResetPasswordPage() {
  redirect("/forgot-password");
}
