import { revalidateTag } from "next/cache";

export function dashboardCacheTag(workspaceId: string) {
  return `dashboard-${workspaceId}`;
}

export function inventoryCacheTag(workspaceId: string) {
  return `inventory-${workspaceId}`;
}

export function transactionsCacheTag(workspaceId: string) {
  return `transactions-${workspaceId}`;
}

/** Call after any change that affects dashboard, inventory, or transaction lists. */
export function revalidateWorkspaceDashboard(workspaceId: string) {
  revalidateTag(dashboardCacheTag(workspaceId));
  revalidateTag(inventoryCacheTag(workspaceId));
  revalidateTag(transactionsCacheTag(workspaceId));
}
