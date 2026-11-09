import type { Metadata } from 'next';
import {
  getPublicTenantProfile,
  getPublicNotices,
  getPublicStaff,
  getPublicGallery,
} from '@/features/public/actions';
import { PublicHomepage } from '@/features/public/components/public-homepage';

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getPublicTenantProfile();
  const nameEn = profile?.nameEn || profile?.name || 'Institution Website';
  return {
    title: nameEn,
    description: profile?.mottoEn || profile?.nameBn || 'Official Institutional Website',
  };
}

export default async function PublicHomeRoute() {
  const [profile, notices, staff, gallery] = await Promise.all([
    getPublicTenantProfile(),
    getPublicNotices(),
    getPublicStaff(),
    getPublicGallery(),
  ]);

  return (
    <PublicHomepage
      profile={profile}
      notices={notices}
      staff={staff}
      gallery={gallery}
    />
  );
}
