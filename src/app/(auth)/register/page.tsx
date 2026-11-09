import { RegisterForm } from "@/features/auth/components/register-form";

export const metadata = {
  title: "Register Institution | MRM InfoTech",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
      <RegisterForm />
    </main>
  );
}
