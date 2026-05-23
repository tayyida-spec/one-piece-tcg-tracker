import { requireUser } from "@/lib/auth";
import { resolveUserDisplayName } from "@/lib/user-display";
import { PageHeading } from "@/components/page-heading";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const { user, membership } = await requireUser();

  const displayName = resolveUserDisplayName(user, membership);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeading
        title="Profile"
        description="Update how your name appears and change your password."
      />
      <ProfileForm
        email={user.email ?? ""}
        displayName={displayName}
        role={membership.role}
        workspaceName={membership.workspace.name}
      />
    </div>
  );
}
