import { prisma } from "@/lib/prisma";
import type { InventoryRow } from "@/components/inventory-table";

async function loadInventoryRows(workspaceId: string): Promise<InventoryRow[]> {
  const items = await prisma.inventoryItem.findMany({
    where: { workspaceId },
    orderBy: [{ status: "asc" }, { cardName: "asc" }],
    select: {
      id: true,
      itemType: true,
      cardName: true,
      cardId: true,
      series: true,
      rarity: true,
      language: true,
      variant: true,
      condition: true,
      quantity: true,
      location: true,
      purchasePrice: true,
      currentMarketPrice: true,
      owner: true,
      status: true,
      notes: true,
    },
  });

  return items.map((item) => ({
    id: item.id,
    itemType: item.itemType,
    cardName: item.cardName,
    cardId: item.cardId,
    series: item.series,
    rarity: item.rarity,
    language: item.language,
    variant: item.variant,
    condition: item.condition,
    quantity: Number(item.quantity),
    location: item.location,
    purchasePrice: Number(item.purchasePrice ?? 0),
    currentMarketPrice: Number(item.currentMarketPrice ?? 0),
    owner: item.owner,
    status: item.status,
    notes: item.notes,
  }));
}

export { loadInventoryRows };
