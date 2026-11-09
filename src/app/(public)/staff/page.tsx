import type { Metadata } from "next";
import { FetchNotice } from "@/components/common/fetch-notice";
import { httpsUrl, recordList, textOf } from "@/features/content/safe-url";
import { copy } from "@/i18n/server-copy";
import { fetchPublic } from "@/lib/data/public";
import { getLocale } from "next-intl/server";
import { withCanonical } from "@/lib/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const text = await copy("staff");
  return withCanonical("/staff", { title: text.title });
}

export default async function StaffPage() {
  const [text, locale, result] = await Promise.all([copy("staff"), getLocale(), fetchPublic("/api/v1/staff", 30, "staff")]);
  const items = result.status === "success" ? recordList(result.data) : null;
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      {result.status !== "success" ? <FetchNotice status={result.status} notFound={text.notFound} unavailable={text.unavailable} invalid={text.invalid} forbidden={text.forbidden} /> : null}
      {result.status === "success" && !items ? <FetchNotice status="invalid-response" notFound={text.notFound} unavailable={text.unavailable} invalid={text.invalid} forbidden={text.forbidden} /> : null}
      {items && items.length === 0 ? <p className="text-muted-foreground">{text.empty}</p> : null}
      <ul className="grid gap-3">
        {items?.map((person) => {
          const photo = httpsUrl(person.photoUrl);
          const name = locale === "bn" ? textOf(person.nameBn) : textOf(person.nameEn) || textOf(person.nameBn);
          const designation = locale === "bn" ? textOf(person.designationBn) : textOf(person.designationEn);
          return (
            <li key={textOf(person.id)} className="rounded-lg border p-4">
              {photo ? <img src={photo} alt="" className="mb-2 h-24 w-24 rounded-full object-cover" /> : null}
              <p className="font-medium">{name}</p>
              {designation ? <p className="text-sm text-muted-foreground">{designation}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
