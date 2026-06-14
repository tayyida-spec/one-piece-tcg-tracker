import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { InventoryRow } from "@/components/inventory-table";
import { inventoryCacheTag } from "@/lib/cache-tags";

/** Fix cases that were decremented to sold_out/qty 0 by the old crack flow. */
async function repairMisclassifiedCrackedCases(workspaceId: string) {
  await prisma.inventoryItem.updateMany({
    where: {
      workspaceId,
      itemType: { in: ["sealed", "case"] },
      status: "sold_out",
      quantity: { lte: 0 },
      notes: { contains: "Case crack", mode: "insensitive" },
    },
    data: {
      status: "cracked",
      quantity: 1,
    },
  });
}

async function loadInventoryRows(workspaceId: string): Promise<InventoryRow[]> {
  await repairMisclassifiedCrackedCases(workspaceId);
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

export function getCachedInventoryRows(workspaceId: string) {
  return unstable_cache(
    () => loadInventoryRows(workspaceId),
    [inventoryCacheTag(workspaceId)],
    { revalidate: 120, tags: [inventoryCacheTag(workspaceId)] }
  )();
}

/** Fresh inventory list (no cache) — use on Inventory page so new rows show immediately. */
export { loadInventoryRows };
