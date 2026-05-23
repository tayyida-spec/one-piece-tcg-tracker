import { revalidateTag } from "next/cache";

export function dashboardCacheTag(workspaceId: string) {
  return `dashboard-${workspaceId}`;
}

/** Call after any change that affects dashboard P/L or stats. */
export function revalidateWorkspaceDashboard(workspaceId: string) {
  revalidateTag(dashboardCacheTag(workspaceId));
}
