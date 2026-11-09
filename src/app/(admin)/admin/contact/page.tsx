import { ContactInbox } from "./contact-inbox";
import { copy } from "@/i18n/server-copy";

export default async function AdminContactPage() {
  const text = await copy("contact");
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <ContactInbox text={text} />
    </section>
  );
}
