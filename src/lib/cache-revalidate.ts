import { revalidateTag } from "next/cache";
import {
  capitalCacheTag,
  dashboardCacheTag,
  expensesCacheTag,
  inventoryCacheTag,
  transactionsCacheTag,
} from "@/lib/cache-tags";

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
