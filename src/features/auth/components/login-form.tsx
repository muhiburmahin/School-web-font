"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { backendContract } from "@/config/backend-contract";
import { apiFetch } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";
import { safeNextPath } from "@/lib/safe-next-path";
import { loginSchema } from "../schemas";
import { parseCurrentUser, pathAfterLogin } from "../session";
import type en from "../../../../messages/en.json";

type AuthCopy = typeof en.auth;

/**
 * Maps a failed sign-in to one of a few fixed messages. The server's wording is never shown,
 * so a missing account, a wrong password, a pending school, and a wrong host all look the same.
 */
export function loginFailureMessage(error: unknown, copy: AuthCopy): string {
  if (error instanceof ApiError) {
    if (error.status === 403 && error.messages.includes(backendContract.mfaUnavailableMessage)) return copy.mfaUnavailable;
    if (error.status === 403) return copy.forbidden;
    if (error.status === 429) return copy.rateLimited;
    if (error.status >= 500 || error.status === 0) return copy.serviceUnavailable;
  }
  return copy.rejected;
}

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const issues = parsed.error.flatten().fieldErrors;
      setFieldError({ email: issues.email?.[0] ? t("emailInvalid") : undefined, password: issues.password?.[0] ? t("passwordInvalid") : undefined });
      return;
    }
    setFieldError({});
    setPending(true);
    try {
      const login = await apiFetch<{ mfaRequired?: boolean }>(backendContract.auth.login.path, {
        method: "POST",
        body: { email: parsed.data.email, password: parsed.data.password },
      });
      if (login?.mfaRequired) {
        setError(t("mfaUnavailable"));
        return;
      }
      const me = await apiFetch<unknown>(backendContract.auth.me.path);
      const user = parseCurrentUser(me);
      if (!user) {
        setError(t("unavailable"));
        return;
      }
      router.push(pathAfterLogin(user, safeNextPath(params.get("next"))));
      router.refresh();
    } catch (failure) {
      setError(loginFailureMessage(failure, {
        mfaUnavailable: t("mfaUnavailable"), forbidden: t("forbidden"), rateLimited: t("rateLimited"),
        serviceUnavailable: t("serviceUnavailable"), rejected: t("rejected"),
      } as AuthCopy));
    } finally {
      setPending(false);
    }
  }

  const input = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{t("loginHint")}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{t("signIn")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("signInBody")}</p>
      </div>
      {error ? (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-slate-700">{t("emailLabel")}</label>
          <input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(fieldError.email)} aria-describedby={fieldError.email ? "login-email-error" : undefined} className={input} />
          {fieldError.email ? <p id="login-email-error" className="mt-1 text-xs text-red-600">{fieldError.email}</p> : null}
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-slate-700">{t("passwordLabel")}</label>
          <div className="flex gap-2">
            <input id="login-password" type={show ? "text" : "password"} autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(fieldError.password)} className={input} />
            <button type="button" onClick={() => setShow((value) => !value)} aria-pressed={show}
              className="shrink-0 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50">
              {show ? t("hidePassword") : t("showPassword")}
            </button>
          </div>
          {fieldError.password ? <p className="mt-1 text-xs text-red-600">{fieldError.password}</p> : null}
        </div>
        <button type="submit" disabled={pending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
          {pending ? t("signingIn") : t("signIn")}
        </button>
      </form>
      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
        <p><Link className="font-medium text-blue-700 hover:underline" href="/forgot-password">{t("forgotTitle")}</Link></p>
        <p><Link className="font-semibold text-blue-700 hover:underline" href="/register">{t("registerLink")}</Link></p>
      </div>
    </div>
  );
}
