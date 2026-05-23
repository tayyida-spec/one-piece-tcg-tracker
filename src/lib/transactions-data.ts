import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TransactionLogRow } from "@/components/transaction-log-table";
import { transactionsCacheTag } from "@/lib/cache-tags";

async function loadTransactionLogRows(workspaceId: string): Promise<TransactionLogRow[]> {
  const lines = await prisma.transactionLine.findMany({
    where: { transaction: { workspaceId } },
    orderBy: [
      { transaction: { date: "desc" } },
      { transaction: { displayId: "asc" } },
      { cardName: "asc" },
    ],
    select: {
      id: true,
      itemType: true,
      cardName: true,
      cardId: true,
      series: true,
      rarity: true,
      quantity: true,
      unitPrice: true,
      smartpacFee: true,
      owner: true,
      reimbursement: true,
      platform: true,
      notes: true,
      transaction: {
        select: {
          id: true,
          displayId: true,
          transactionType: true,
          date: true,
          smartpacFee: true,
        },
      },
    },
  });

  return lines.map((line) => ({
    id: line.id,
    itemType: line.itemType,
    cardName: line.cardName,
    cardId: line.cardId,
    series: line.series,
    rarity: line.rarity,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    smartpacFee: line.smartpacFee != null ? Number(line.smartpacFee) : null,
    owner: line.owner,
    reimbursement: line.reimbursement,
    platform: line.platform,
    notes: line.notes,
    transaction: {
      id: line.transaction.id,
      displayId: line.transaction.displayId,
      transactionType: line.transaction.transactionType,
      date: line.transaction.date.toISOString(),
      smartpacFee:
        line.transaction.smartpacFee != null ? Number(line.transaction.smartpacFee) : null,
    },
  }));
}

export function getCachedTransactionLogRows(workspaceId: string) {
  return unstable_cache(
    () => loadTransactionLogRows(workspaceId),
    [transactionsCacheTag(workspaceId)],
    { revalidate: 120, tags: [transactionsCacheTag(workspaceId)] }
  )();
}
