import { ProfileThemeManager } from "@/features/institution-profile/components/profile-theme-manager";

export const metadata = {
  title: "Institution Profile | Admin",
  robots: { index: false, follow: false },
};

export default function AdminProfilePage() {
  return (
    <section className="space-y-6">
      <ProfileThemeManager />
    </section>
  );
}

