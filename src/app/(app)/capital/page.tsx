import { requireUser } from "@/lib/auth";
import {
  getCachedCapitalRows,
  getCachedWorkspaceTotalCapital,
} from "@/lib/capital-data";
import { PageHeading } from "@/components/page-heading";
import { CapitalClient } from "@/components/capital-client";

export default async function CapitalPage() {
  const { workspaceId, membership } = await requireUser();
  const [rows, totalCapital] = await Promise.all([
    getCachedCapitalRows(workspaceId),
    getCachedWorkspaceTotalCapital(workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Capital"
        description="Log each cash pump-in. Total pumped-in capital feeds Remaining capital on the dashboard."
      />
      <CapitalClient
        rows={rows}
        totalCapital={totalCapital}
        isAdmin={membership.role === "admin"}
        usingEnvFallback={rows.length === 0}
      />
    </div>
  );
}
