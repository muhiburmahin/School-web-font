import { notFound } from "next/navigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { backendContract } from "@/config/backend-contract";
import { PageEditor } from "@/features/pages/components/page-editor";
import { pageMessages } from "@/features/pages/messages";
import { verifySession } from "@/lib/auth/dal";
import { parseRecordId } from "@/lib/validation/identifiers";
import { hasPermission } from "@/features/auth/permissions";

export default async function AdminPageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = parseRecordId(rawId);
  if (!id) notFound();
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
            <BreadcrumbLink href="/admin/pages">{pageMessages.title}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{pageMessages.edit}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {canManage ? <PageEditor id={id} /> : <p>{pageMessages.readOnly}</p>}
    </section>
  );
}
