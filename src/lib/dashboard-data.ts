import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  buildPlDashboard,
  type PlLineInput,
  type PlDashboardData,
  type PlInventoryInput,
} from "@/lib/pl-dashboard";
import { dashboardCacheTag } from "@/lib/cache-tags";
import { loadExpensesSafe } from "@/lib/safe-db";
import { getWorkspaceTotalCapital } from "@/lib/capital-data";

export type ExpenseSummary = {
  total: number;
  count: number;
  byCategory: { category: string; amount: number }[];
};

export type DashboardPayload = {
  transactionCount: number;
  inventoryCount: number;
  inStockCount: number;
  plData: PlDashboardData;
  plLines: PlLineInput[];
  inventorySnapshot: PlInventoryInput[];
  expenseSummary: ExpenseSummary;
  recentTransactions: {
    id: string;
    displayId: string;
    transactionType: string;
    date: string;
    lineCount: number;
  }[];
};

async function loadDashboardPayload(workspaceId: string): Promise<DashboardPayload> {
  const [transactionCount, inventoryCount, recentTransactions, lines, inventoryItems, expenses, workspaceTotalCapital] =
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
          inventoryItem: { select: { purchasePrice: true, currentMarketPrice: true } },
        },
        orderBy: { transaction: { date: "asc" } },
      }),
      prisma.inventoryItem.findMany({
        where: { workspaceId },
        select: {
          id: true,
          itemType: true,
          cardId: true,
          series: true,
          rarity: true,
          variant: true,
          language: true,
          quantity: true,
          purchasePrice: true,
          currentMarketPrice: true,
          marketPriceUpdatedAt: true,
          status: true,
        },
      }),
      loadExpensesSafe(workspaceId),
      getWorkspaceTotalCapital(workspaceId),
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

  const inventorySnapshot: PlInventoryInput[] = inventoryItems.map((i) => ({
    id: i.id,
    itemType: i.itemType,
    cardId: i.cardId,
    series: i.series,
    rarity: i.rarity,
    variant: i.variant,
    language: i.language,
    quantity: Number(i.quantity),
    purchasePrice: i.purchasePrice != null ? Number(i.purchasePrice) : null,
    currentMarketPrice:
      i.currentMarketPrice != null ? Number(i.currentMarketPrice) : null,
    marketPriceUpdatedAt: i.marketPriceUpdatedAt?.toISOString() ?? null,
    status: i.status,
  }));

  const categoryMap = new Map<string, number>();
  let expensesTotal = 0;
  for (const e of expenses) {
    const amount = Number(e.amount);
    expensesTotal += amount;
    categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + amount);
  }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const expenseSummary: ExpenseSummary = {
    total: round2(expensesTotal),
    count: expenses.length,
    byCategory: [...categoryMap.entries()]
      .map(([category, amount]) => ({ category, amount: round2(amount) }))
      .sort((a, b) => b.amount - a.amount),
  };

  const plData = buildPlDashboard(plLines, inventorySnapshot, expenseSummary.total, workspaceTotalCapital);

  return {
    transactionCount,
    inventoryCount,
    inStockCount: plData.inStockCount,
    plData,
    plLines,
    inventorySnapshot,
    expenseSummary,
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
