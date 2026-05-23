import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeIdentity } from "@/lib/inventory-identity";

export async function findOrCreateInventoryItem(
  workspaceId: string,
  data: {
    itemType?: string;
    cardName: string;
    cardId: string;
    series?: string;
    rarity?: string;
    language?: string;
    variant?: string;
    condition?: string | null;
    location?: string | null;
    owner?: string | null;
    notes?: string | null;
    purchasePrice?: number | null;
    currentMarketPrice?: number | null;
  }
) {
  const identity = normalizeIdentity({
    itemType: data.itemType,
    cardId: data.cardId,
    series: data.series,
    rarity: data.rarity,
    language: data.language,
    variant: data.variant,
  });

  const existing = await prisma.inventoryItem.findUnique({
    where: {
      workspaceId_itemType_cardId_series_rarity_variant_language: {
        workspaceId,
        ...identity,
      },
    },
  });

  if (existing) return existing;

  return prisma.inventoryItem.create({
    data: {
      workspaceId,
      ...identity,
      cardName: data.cardName.trim(),
      condition: data.condition ?? null,
      location: data.location ?? null,
      owner: data.owner ?? null,
      notes: data.notes ?? null,
      purchasePrice: data.purchasePrice ?? null,
      currentMarketPrice: data.currentMarketPrice ?? null,
      quantity: 0,
      status: "in_stock",
    },
  });
}

export async function applyQuantityDelta(
  inventoryItemId: string,
  delta: number,
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? prisma;
  const item = await db.inventoryItem.findUniqueOrThrow({
    where: { id: inventoryItemId },
  });

  const nextQty = Number(item.quantity) + delta;
  const status = nextQty <= 0 ? "sold_out" : "in_stock";

  return db.inventoryItem.update({
    where: { id: inventoryItemId },
    data: {
      quantity: nextQty,
      status,
    },
  });
}

export async function nextTransactionDisplayId(workspaceId: string) {
  const count = await prisma.transaction.count({ where: { workspaceId } });
  return `TX-${String(count + 1).padStart(4, "0")}`;
}
