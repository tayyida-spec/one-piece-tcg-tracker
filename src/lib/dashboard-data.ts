import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  buildPlDashboard,
  type PlLineInput,
  type PlDashboardData,
  type PlInventoryInput,
} from "@/lib/pl-dashboard";
import { dashboardCacheTag } from "@/lib/cache-tags";

export type DashboardPayload = {
  transactionCount: number;
  inventoryCount: number;
  inStockCount: number;
  plData: PlDashboardData;
  plLines: PlLineInput[];
  inventorySnapshot: PlInventoryInput[];
  recentTransactions: {
    id: string;
    displayId: string;
    transactionType: string;
    date: string;
    lineCount: number;
  }[];
};

async function loadDashboardPayload(workspaceId: string): Promise<DashboardPayload> {
  const [transactionCount, inventoryCount, recentTransactions, lines, inStockItems] =
    await Promise.all([
      prisma.transaction.count({ where: { workspaceId } }),
      prisma.inventoryItem.count({ where: { workspaceId } }),
      prisma.transaction.findMany({
        where: { workspaceId },
        orderBy: { date: "desc" },
        take: 5,
        include: { _count: { select: { lines: true } } },
      }),
      prisma.transactionLine.findMany({
        where: { transaction: { workspaceId } },
        include: {
          transaction: true,
          inventoryItem: { select: { purchasePrice: true } },
        },
        orderBy: { transaction: { date: "asc" } },
      }),
      prisma.inventoryItem.findMany({
        where: { workspaceId, status: "in_stock" },
        select: {
          id: true,
          quantity: true,
          purchasePrice: true,
          currentMarketPrice: true,
          status: true,
        },
      }),
    ]);

  const plLines: PlLineInput[] = lines.map((line) => ({
    id: line.id,
    transactionId: line.transactionId,
    displayId: line.transaction.displayId,
    cardName: line.cardName,
    transactionType: line.transaction.transactionType,
    date: line.transaction.date.toISOString(),
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    inventoryItemId: line.inventoryItemId,
    itemType: line.itemType,
    owner: line.owner,
    cardId: line.cardId,
    series: line.series,
    rarity: line.rarity,
    variant: line.variant,
    language: line.language,
    purchasePrice:
      line.inventoryItem?.purchasePrice != null
        ? Number(line.inventoryItem.purchasePrice)
        : null,
  }));

  const inventorySnapshot: PlInventoryInput[] = inStockItems.map((i) => ({
    id: i.id,
    quantity: Number(i.quantity),
    purchasePrice: i.purchasePrice != null ? Number(i.purchasePrice) : null,
    currentMarketPrice:
      i.currentMarketPrice != null ? Number(i.currentMarketPrice) : null,
    status: i.status,
  }));

  const plData = buildPlDashboard(plLines, inventorySnapshot);

  return {
    transactionCount,
    inventoryCount,
    inStockCount: plData.inStockCount,
    plData,
    plLines,
    inventorySnapshot,
    recentTransactions: recentTransactions.map((t) => ({
      id: t.id,
      displayId: t.displayId,
      transactionType: t.transactionType,
      date: t.date.toISOString(),
      lineCount: t._count.lines,
    })),
  };
}

/** Cached dashboard queries — invalidated on writes via revalidateWorkspaceDashboard. */
export function getCachedDashboardPayload(workspaceId: string) {
  return unstable_cache(
    () => loadDashboardPayload(workspaceId),
    [dashboardCacheTag(workspaceId)],
    { revalidate: 120, tags: [dashboardCacheTag(workspaceId)] }
  )();
}
