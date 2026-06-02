import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isSchemaNotReadyError } from "@/lib/safe-db";
import { capitalCacheTag } from "@/lib/cache-tags";

/** Fallback when no capital contributions exist in the database yet. */
export function getEnvCapitalFallback(): number {
  const raw = process.env.WORKSPACE_TOTAL_CAPITAL_SGD;
  if (raw == null || raw === "") return 5000;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5000;
}

async function sumCapitalContributions(workspaceId: string): Promise<number | null> {
  try {
    const agg = await prisma.capitalContribution.aggregate({
      where: { workspaceId },
      _sum: { amount: true },
      _count: true,
    });
    if (agg._count === 0) return null;
    return Number(agg._sum.amount ?? 0);
  } catch (e) {
    if (isSchemaNotReadyError(e)) return null;
    throw e;
  }
}

/** Total pumped-in capital: sum of contributions, or env fallback if none logged yet. */
export async function getWorkspaceTotalCapital(workspaceId: string): Promise<number> {
  const sum = await sumCapitalContributions(workspaceId);
  if (sum != null) return Math.round(sum * 100) / 100;
  return getEnvCapitalFallback();
}

export type CapitalContributionRow = {
  id: string;
  date: string;
  amount: number;
  contributor: string | null;
  notes: string | null;
  createdAt: string;
};

async function loadCapitalRows(workspaceId: string): Promise<CapitalContributionRow[]> {
  try {
    const rows = await prisma.capitalContribution.findMany({
      where: { workspaceId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return rows.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      amount: Number(r.amount),
      contributor: r.contributor,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (e) {
    if (isSchemaNotReadyError(e)) return [];
    throw e;
  }
}

export function getCachedCapitalRows(workspaceId: string) {
  return unstable_cache(
    () => loadCapitalRows(workspaceId),
    [capitalCacheTag(workspaceId)],
    { revalidate: 120, tags: [capitalCacheTag(workspaceId)] }
  )();
}

export function getCachedWorkspaceTotalCapital(workspaceId: string) {
  return unstable_cache(
    () => getWorkspaceTotalCapital(workspaceId),
    [`${capitalCacheTag(workspaceId)}-total`],
    { revalidate: 120, tags: [capitalCacheTag(workspaceId)] }
  )();
}
