import { PlatformDashboardClient } from "@/features/platform/components/platform-dashboard-client";

export const metadata = {
  title: "Super Admin Platform | MRM InfoTech",
  robots: { index: false, follow: false },
};

export default function PlatformPage() {
  return <PlatformDashboardClient />;
}
