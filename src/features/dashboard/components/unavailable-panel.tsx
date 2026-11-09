import { copy } from "@/i18n/server-copy";

export async function UnavailablePanel({ body }: { body: "newsBody" | "principalBody" | "resultsBody" }) {
  const dashboard = await copy("dashboard");
  return (
    <section className="grid max-w-2xl gap-3">
      <h1 className="text-2xl font-semibold">{dashboard.comingSoonTitle}</h1>
      <p className="text-sm leading-6 text-muted-foreground">{dashboard[body]}</p>
    </section>
  );
}
