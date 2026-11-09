import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Password help | MRM InfoTech",
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">{t("forgotTitle")}</h1>
        <p className="mt-3 text-sm text-slate-600">{t("forgotBody")}</p>
        <Link className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700" href="/login">
          {t("backToSignIn")}
        </Link>
      </div>
    </main>
  );
}
