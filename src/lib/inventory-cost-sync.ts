import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Set inventory purchasePrice to weighted avg of all linked buy lines. */
export async function recalcInventoryPurchasePrice(
  inventoryItemId: string,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;

  const buyLines = await db.transactionLine.findMany({
    where: {
      inventoryItemId,
      transaction: { transactionType: "buy" },
    },
    select: { quantity: true, unitPrice: true },
  });

  let purchasePrice: number | null = null;
  if (buyLines.length > 0) {
    let totalQty = 0;
    let totalCost = 0;
    for (const line of buyLines) {
      const qty = Number(line.quantity);
      if (qty <= 0) continue;
      totalQty += qty;
      totalCost += qty * Number(line.unitPrice);
    }
    if (totalQty > 0) {
      purchasePrice = round2(totalCost / totalQty);
    }
  }

  return db.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { purchasePrice },
  });
}

export async function recalcAllInventoryPurchasePrices(workspaceId: string) {
  const items = await prisma.inventoryItem.findMany({
    where: { workspaceId },
    select: { id: true },
  });

  let updated = 0;
  for (const item of items) {
    const before = await prisma.inventoryItem.findUnique({
      where: { id: item.id },
      select: { purchasePrice: true },
    });
    const after = await recalcInventoryPurchasePrice(item.id);
    const beforeNum = before?.purchasePrice != null ? Number(before.purchasePrice) : null;
    const afterNum = after.purchasePrice != null ? Number(after.purchasePrice) : null;
    if (beforeNum !== afterNum) updated += 1;
  }

  return { total: items.length, updated };
}
