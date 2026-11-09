import type { Metadata } from "next";
import { ContactForm } from "../contact-form";
import { copy } from "@/i18n/server-copy";
import { withCanonical } from "@/lib/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const text = await copy("contact");
  return withCanonical("/contact/send", { title: text.title });
}

export default async function ContactSendPage() {
  const text = await copy("contact");
  return (
    <section className="grid max-w-xl gap-4">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <ContactForm text={text} />
    </section>
  );
}
