import { requireUser } from "@/lib/auth";
import { getCachedDashboardPayload } from "@/lib/dashboard-data";
import { resolveDashboardLayout } from "@/lib/dashboard-sections";
import { getMemberDashboardPrefs } from "@/lib/safe-db";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardPage() {
  const { workspaceId, membership } = await requireUser();
  const dashboardPrefs = await getMemberDashboardPrefs(membership.id);
  const layout = resolveDashboardLayout(dashboardPrefs);

  const {
    transactionCount,
    inventoryCount,
    inStockCount,
    plData,
    plLines,
    inventorySnapshot,
    expenseSummary,
    recentTransactions,
  } = await getCachedDashboardPayload(workspaceId);

  return (
    <DashboardShell
      initialLayout={layout}
      transactionCount={transactionCount}
      inventoryCount={inventoryCount}
      inStockCount={inStockCount}
      plData={plData}
      plLines={plLines}
      inventorySnapshot={inventorySnapshot}
      expenseSummary={expenseSummary}
      recentTransactions={recentTransactions}
    />
  );
}
