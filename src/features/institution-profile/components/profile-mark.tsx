import { SafeImage } from "@/components/safe/safe-image";
import { sameInstitutionName } from "@/lib/menu-label";
import { profileMessages } from "../messages";
import type { ProfileView } from "../types";

export function ProfileMark({ profile }: { profile: ProfileView }) {
  const secondary = sameInstitutionName(profile.nameEn, profile.nameBn) ? "" : profile.nameBn;
  if (!profile.logoUrl) {
    return (
      <span className="text-base font-semibold tracking-tight">
        {profile.nameEn}
        {secondary ? <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{secondary}</span> : null}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <SafeImage src={profile.logoUrl} alt="" fallback={profileMessages.imageUnavailable} />
      <span className="text-base font-semibold tracking-tight">{profile.nameEn}</span>
    </span>
  );
}
