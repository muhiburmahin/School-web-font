import { NavigationManager } from "./navigation-manager";
import { copy } from "@/i18n/server-copy";

export default async function AdminNavigationPage() {
  const text = await copy("navigation");
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">{text.headerTitle}</h1>
      <NavigationManager text={text} location="HEADER" />
    </section>
  );
}
