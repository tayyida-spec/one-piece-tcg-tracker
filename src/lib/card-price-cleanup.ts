import { prisma } from "@/lib/prisma";
import {
  fetchBandaiOp16EnglishNames,
  formatEnglishCardName,
  isOp16PriceListCard,
} from "@/lib/op16-english-names";

export type Op16PriceListCleanupResult = {
  removed: number;
  translated: number;
  unlinked: number;
};

/** Keep OP16 (+ DON) cards only; set English names from the official Bandai list. */
export async function cleanupOp16PriceList(workspaceId: string): Promise<Op16PriceListCleanupResult> {
  const lookup = await fetchBandaiOp16EnglishNames();

  const removed = await prisma.cardPriceEntry.deleteMany({
    where: {
      workspaceId,
      NOT: {
        OR: [{ cardId: { startsWith: "OP16-", mode: "insensitive" } }, { cardId: { startsWith: "DON-" } }],
      },
    },
  });

  const unlinked = await prisma.cardPriceEntry.updateMany({
    where: { workspaceId, inventoryItemId: { not: null } },
    data: { inventoryItemId: null },
  });

  const rows = await prisma.cardPriceEntry.findMany({
    where: { workspaceId },
    select: { id: true, cardId: true, variant: true, cardName: true },
  });

  let translated = 0;
  for (const row of rows) {
    if (!isOp16PriceListCard(row.cardId)) continue;
    const english = formatEnglishCardName(lookup, row.cardId, row.variant, row.cardName);
    if (english === row.cardName) continue;
    await prisma.cardPriceEntry.update({
      where: { id: row.id },
      data: { cardName: english, series: "OP16" },
    });
    translated += 1;
  }

  return { removed: removed.count, translated, unlinked: unlinked.count };
}
