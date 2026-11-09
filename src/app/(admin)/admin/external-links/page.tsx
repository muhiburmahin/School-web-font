import { ExternalLinksManager } from "./links-manager";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { externalLinkMessages } from "@/features/external-links/messages";

export default function AdminExternalLinksPage() {
  return (
    <section className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">{externalLinkMessages.dashboard || "Dashboard"}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{externalLinkMessages.title || "External Links"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {externalLinkMessages.title || "External Links"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage useful external portals, government boards, admission gateways, and social channels.
        </p>
      </div>

      <ExternalLinksManager />
    </section>
  );
}
