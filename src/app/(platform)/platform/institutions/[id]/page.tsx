import { InstitutionDetail } from "@/features/platform/components/institution-detail";

export default async function PlatformInstitutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InstitutionDetail institutionId={id} />;
}
