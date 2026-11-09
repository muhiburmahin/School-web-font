"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { backendContract } from "@/config/backend-contract";
import { apiFetch } from "@/lib/api-client";
import { ApiError } from "@/lib/api-error";

const TYPES = ["SCHOOL", "COLLEGE", "SCHOOL_AND_COLLEGE", "MADRASAH", "TECHNICAL_INSTITUTE", "COACHING_CENTER", "TRAINING_CENTER", "OTHER"] as const;
const LEVELS = ["PRIMARY", "JUNIOR_SECONDARY", "SECONDARY", "HIGHER_SECONDARY", "SCHOOL_AND_COLLEGE", "MADRASAH", "TECHNICAL", "COLLEGE"] as const;

interface District {
  id: string;
  nameEn: string;
  nameBn: string;
}

interface Values {
  nameEn: string;
  nameBn: string;
  institutionType: string;
  level: string;
  siteSlug: string;
  headName: string;
  headTitle: string;
  officialEmail: string;
  officialPhone: string;
  districtId: string;
  upazilaName: string;
  addressText: string;
  eiin: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  website: string;
}

const EMPTY: Values = {
  nameEn: "", nameBn: "", institutionType: "SCHOOL", level: "", siteSlug: "", headName: "", headTitle: "", officialEmail: "",
  officialPhone: "", districtId: "", upazilaName: "", addressText: "", eiin: "", password: "", confirmPassword: "", acceptedTerms: false, website: "",
};

const input = "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200";

function Field({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p role="alert" className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [districts, setDistricts] = useState<District[]>([]);
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [list, config] = await Promise.allSettled([
        apiFetch<unknown>("/api/v1/reference/districts"),
        apiFetch<{ registrationOpen?: boolean }>("/api/v1/platform-config"),
      ]);
      if (!alive) return;
      if (list.status === "fulfilled" && Array.isArray(list.value)) setDistricts(list.value as District[]);
      if (config.status === "fulfilled" && config.value && config.value.registrationOpen === false) setOpen(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validate(): Partial<Record<keyof Values, string>> {
    const found: Partial<Record<keyof Values, string>> = {};
    const required: Array<keyof Values> = ["nameEn", "nameBn", "siteSlug", "headName", "districtId", "upazilaName", "addressText"];
    for (const key of required) if (!String(values[key]).trim()) found[key] = t("requiredField");
    if (values.siteSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.siteSlug)) found.siteSlug = t("siteSlugHint");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.officialEmail)) found.officialEmail = t("emailInvalid");
    if (!/^(?:\+?88)?0?1[3-9][0-9]{8}$|^[0-9+() .-]{7,20}$/.test(values.officialPhone)) found.officialPhone = t("phoneInvalid");
    if (values.eiin && !/^[0-9]{6}$/.test(values.eiin)) found.eiin = t("eiinInvalid");
    if (values.password.length < 12) found.password = t("passwordRules");
    else if (values.password !== values.confirmPassword) found.confirmPassword = t("passwordMismatch");
    if (!values.acceptedTerms) found.acceptedTerms = t("termsRequired");
    return found;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError(t("checkFields"));
      return;
    }
    setPending(true);
    try {
      await apiFetch(backendContract.auth.register.path, {
        method: "POST",
        body: {
          nameEn: values.nameEn.trim(),
          nameBn: values.nameBn.trim(),
          institutionType: values.institutionType,
          ...(values.level ? { level: values.level } : {}),
          siteSlug: values.siteSlug.trim(),
          officialEmail: values.officialEmail.trim(),
          officialPhone: values.officialPhone.trim(),
          headName: values.headName.trim(),
          ...(values.headTitle.trim() ? { headTitle: values.headTitle.trim() } : {}),
          districtId: values.districtId,
          upazilaName: values.upazilaName.trim(),
          addressText: values.addressText.trim(),
          ...(values.eiin ? { eiin: values.eiin } : {}),
          password: values.password,
          confirmPassword: values.confirmPassword,
          acceptedTerms: values.acceptedTerms,
          website: values.website,
        },
      });
      setDone(true);
    } catch (failure) {
      if (failure instanceof ApiError && failure.status === 409) {
        const text = failure.messages.join(" ").toLowerCase();
        if (text.includes("email") || text.includes("account")) setErrors({ officialEmail: t("emailUsed") });
        else if (text.includes("eiin")) setErrors({ eiin: failure.messages[0] });
        else setErrors({ siteSlug: t("slugUsed") });
        setFormError(t("checkFields"));
      } else if (failure instanceof ApiError && failure.status === 403) {
        setFormError(t("registrationClosed"));
      } else if (failure instanceof ApiError && failure.status === 429) {
        setFormError(t("rateLimited"));
      } else if (failure instanceof ApiError && failure.status === 400 && failure.messages.length > 0) {
        setFormError(failure.messages.join(" "));
      } else {
        setFormError(t("serviceUnavailable"));
      }
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center" role="status">
        <h1 className="text-2xl font-bold text-emerald-900">{t("registeredPendingTitle")}</h1>
        <p className="mt-3 text-sm text-emerald-800">{t("registeredPending")}</p>
        <Link className="mt-6 inline-flex rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800" href="/login">
          {t("backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">{t("registerTitle")}</h1>
        <p className="mt-1 text-sm text-slate-600">{t("registerHint")}</p>
      </div>
      {!open ? <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{t("registrationClosed")}</div> : null}
      {formError ? <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div> : null}
      <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="r-nameEn" label={t("nameEn")} error={errors.nameEn}>
          <input id="r-nameEn" className={input} value={values.nameEn} onChange={(e) => set("nameEn", e.target.value)} maxLength={200} />
        </Field>
        <Field id="r-nameBn" label={t("nameBn")} error={errors.nameBn}>
          <input id="r-nameBn" lang="bn" className={input} value={values.nameBn} onChange={(e) => set("nameBn", e.target.value)} maxLength={200} />
        </Field>
        <Field id="r-type" label={t("institutionType")}>
          <select id="r-type" className={input} value={values.institutionType} onChange={(e) => set("institutionType", e.target.value)}>
            {TYPES.map((value) => <option key={value} value={value}>{t(`type${value}`)}</option>)}
          </select>
        </Field>
        <Field id="r-level" label={t("level")}>
          <select id="r-level" className={input} value={values.level} onChange={(e) => set("level", e.target.value)}>
            <option value="">—</option>
            {LEVELS.map((value) => <option key={value} value={value}>{t(`level${value}`)}</option>)}
          </select>
        </Field>
        <Field id="r-slug" label={t("siteSlug")} hint={t("siteSlugHint")} error={errors.siteSlug}>
          <input id="r-slug" className={input} value={values.siteSlug} autoCapitalize="none" onChange={(e) => set("siteSlug", e.target.value.toLowerCase())} maxLength={63} />
        </Field>
        <Field id="r-eiin" label={t("eiin")} error={errors.eiin}>
          <input id="r-eiin" className={input} inputMode="numeric" value={values.eiin} onChange={(e) => set("eiin", e.target.value)} maxLength={6} />
        </Field>
        <Field id="r-head" label={t("headName")} error={errors.headName}>
          <input id="r-head" className={input} value={values.headName} onChange={(e) => set("headName", e.target.value)} maxLength={200} />
        </Field>
        <Field id="r-title" label={t("headTitle")}>
          <input id="r-title" className={input} value={values.headTitle} onChange={(e) => set("headTitle", e.target.value)} maxLength={100} />
        </Field>
        <Field id="r-email" label={t("officialEmail")} error={errors.officialEmail}>
          <input id="r-email" type="email" autoComplete="email" className={input} value={values.officialEmail} onChange={(e) => set("officialEmail", e.target.value)} maxLength={200} />
        </Field>
        <Field id="r-phone" label={t("officialPhone")} error={errors.officialPhone}>
          <input id="r-phone" type="tel" autoComplete="tel" className={input} value={values.officialPhone} onChange={(e) => set("officialPhone", e.target.value)} maxLength={20} />
        </Field>
        <Field id="r-district" label={t("district")} error={errors.districtId}>
          <select id="r-district" className={input} value={values.districtId} onChange={(e) => set("districtId", e.target.value)}>
            <option value="">{t("selectDistrict")}</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.nameEn} — {d.nameBn}</option>)}
          </select>
        </Field>
        <Field id="r-upazila" label={t("upazila")} error={errors.upazilaName}>
          <input id="r-upazila" className={input} value={values.upazilaName} onChange={(e) => set("upazilaName", e.target.value)} maxLength={100} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="r-address" label={t("addressEn")} error={errors.addressText}>
            <textarea id="r-address" rows={2} className={input} value={values.addressText} onChange={(e) => set("addressText", e.target.value)} maxLength={500} />
          </Field>
        </div>
        <Field id="r-password" label={t("passwordLabel")} hint={t("passwordRules")} error={errors.password}>
          <input id="r-password" type="password" autoComplete="new-password" className={input} value={values.password} onChange={(e) => set("password", e.target.value)} maxLength={200} />
        </Field>
        <Field id="r-confirm" label={t("passwordConfirm")} error={errors.confirmPassword}>
          <input id="r-confirm" type="password" autoComplete="new-password" className={input} value={values.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} maxLength={200} />
        </Field>
        {/* Honeypot: hidden from people and assistive tech; bots tend to fill every field. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="r-website">Website</label>
          <input id="r-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set("website", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" className="mt-1" checked={values.acceptedTerms} onChange={(e) => set("acceptedTerms", e.target.checked)} />
            <span>{t("acceptTerms")}</span>
          </label>
          {errors.acceptedTerms ? <p role="alert" className="mt-1 text-xs text-red-600">{errors.acceptedTerms}</p> : null}
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending || !open} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
            {pending ? t("registering") : t("registerAction")}
          </button>
          <p className="mt-3 text-center text-sm text-slate-600"><Link className="font-medium text-blue-700 hover:underline" href="/login">{t("signInLink")}</Link></p>
        </div>
      </form>
    </div>
  );
}
