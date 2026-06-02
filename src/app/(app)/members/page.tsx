import { requireUser } from "@/lib/auth";
import { loadWorkspaceMembers } from "@/lib/members-data";
import { PageHeading } from "@/components/page-heading";
import { MembersClient } from "@/components/members-client";

export default async function MembersPage() {
  const { workspaceId, user, membership } = await requireUser();
  const members = await loadWorkspaceMembers(workspaceId, user.id);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Members"
        description="Who’s in Three Hats — display names and roles. Admins can promote or demote members."
      />
      <MembersClient members={members} isAdmin={membership.role === "admin"} />
    </div>
  );
}
