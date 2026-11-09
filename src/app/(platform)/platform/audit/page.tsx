import { AuditLog } from "@/features/platform/components/audit-log";
import { platformMessages } from "@/features/platform/messages";

export default function PlatformAuditPage() {
  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-semibold">{platformMessages.auditTitle}</h1>
      <AuditLog />
    </section>
  );
}
