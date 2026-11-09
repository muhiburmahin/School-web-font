import { GalleryManager } from "./gallery-manager";
import { copy } from "@/i18n/server-copy";

export default async function AdminGalleryPage() {
  const text = await copy("gallery");
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">{text.title}</h1>
      <GalleryManager text={text} />
    </section>
  );
}
