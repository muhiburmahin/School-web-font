import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { backendContract } from "@/config/backend-contract";
import { PageManager } from "@/features/pages/components/page-manager";
import { pageMessages } from "@/features/pages/messages";
import { verifySession } from "@/lib/auth/dal";
import { hasPermission } from "@/features/auth/permissions";

export default async function AdminPagesPage() {
  const session = await verifySession();
  const canManage = session.status === "authenticated" && hasPermission(session.user, backendContract.pages.permission);
  return (
    <section className="grid gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">{pageMessages.dashboard}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageMessages.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-semibold">{pageMessages.title}</h1>
      {canManage ? <PageManager /> : <p>{pageMessages.readOnly}</p>}
    </section>
  );
}
