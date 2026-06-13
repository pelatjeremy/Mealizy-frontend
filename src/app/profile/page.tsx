import { ProfileForm } from "@/components/profile/ProfileForm";
import { PageScaffold } from "@/components/ui/PageScaffold";

export default function ProfilePage() {
  return (
    <PageScaffold title="Profil" description="Ajustez les preferences qui pilotent les suggestions, le planning et les quantites.">
      <ProfileForm />
    </PageScaffold>
  );
}
