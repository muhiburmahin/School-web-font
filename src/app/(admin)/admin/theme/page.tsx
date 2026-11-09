import { ProfileThemeManager } from "@/features/institution-profile/components/profile-theme-manager";

export const metadata = {
  title: "Profile & Theme Settings | Admin",
  robots: { index: false, follow: false },
};

export default function AdminThemePage() {
  return (
    <section className="space-y-6">
      <ProfileThemeManager />
    </section>
  );
}
