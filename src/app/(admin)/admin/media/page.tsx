import { MediaManager } from "./media-manager";
import { mediaMessages } from "@/features/media/messages";

export default async function AdminMediaPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {mediaMessages.title || "Media Library"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload and organize documents, photos, and assets across your institution website.
        </p>
      </div>

      <MediaManager />
    </section>
  );
}
