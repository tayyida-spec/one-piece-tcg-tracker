import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Fast path after a buy line is inserted — O(1) vs rescanning all buy lines. */
export async function incrementPurchasePriceOnBuy(
  inventoryItemId: string,
  addedQty: number,
  addedUnitPrice: number,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  if (addedQty <= 0) return null;

  const item = await db.inventoryItem.findUnique({
    where: { id: inventoryItemId },
    select: { purchasePrice: true },
  });
  if (!item) return null;

  const agg = await db.transactionLine.aggregate({
    where: {
      inventoryItemId,
      transaction: { transactionType: "buy" },
    },
    _sum: { quantity: true },
  });

  const totalBuyQty = Number(agg._sum.quantity ?? 0);
  const prevBuyQty = totalBuyQty - addedQty;

  let purchasePrice: number;
  if (prevBuyQty <= 0) {
    purchasePrice = addedUnitPrice;
  } else {
    const prevAvg = Number(item.purchasePrice ?? 0);
    purchasePrice = round2(
      (prevAvg * prevBuyQty + addedUnitPrice * addedQty) / totalBuyQty
    );
  }

  return db.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { purchasePrice },
  });
}

/** Full rescan — use on edits/deletes where incremental math is unreliable. */
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
