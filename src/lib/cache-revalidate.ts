import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  capitalCacheTag,
  dashboardCacheTag,
  expensesCacheTag,
  inventoryCacheTag,
  transactionsCacheTag,
} from "@/lib/cache-tags";

/** Fast invalidation after writes — tags only, no path revalidation. */
export function revalidateWorkspaceDataTags(workspaceId: string) {
  revalidateTag(dashboardCacheTag(workspaceId));
  revalidateTag(inventoryCacheTag(workspaceId));
  revalidateTag(transactionsCacheTag(workspaceId));
}

/** Full invalidation including page paths — use when UI must refresh immediately. */
export function revalidateWorkspaceDashboard(workspaceId: string) {
  revalidateWorkspaceDataTags(workspaceId);
  revalidatePath("/inventory");
  revalidatePath("/case-crack");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
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
