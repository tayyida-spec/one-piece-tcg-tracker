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

export function expensesCacheTag(workspaceId: string) {
  return `expenses-${workspaceId}`;
}

export function capitalCacheTag(workspaceId: string) {
  return `capital-${workspaceId}`;
}

/** Call after any change that affects dashboard, inventory, or transaction lists. */
export function revalidateWorkspaceDashboard(workspaceId: string) {
  revalidateTag(dashboardCacheTag(workspaceId));
  revalidateTag(inventoryCacheTag(workspaceId));
  revalidateTag(transactionsCacheTag(workspaceId));
}

/** Call after capital contribution changes (also refreshes the dashboard). */
export function revalidateWorkspaceCapital(workspaceId: string) {
  revalidateTag(capitalCacheTag(workspaceId));
  revalidateTag(dashboardCacheTag(workspaceId));
}

/** Call after any change to business expenses (also refreshes the dashboard). */
export function revalidateWorkspaceExpenses(workspaceId: string) {
  revalidateTag(expensesCacheTag(workspaceId));
  revalidateTag(dashboardCacheTag(workspaceId));
}
