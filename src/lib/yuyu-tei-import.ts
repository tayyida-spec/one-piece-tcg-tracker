import { prisma } from "@/lib/prisma";
import { normalizeIdentity } from "@/lib/inventory-identity";
import { convertYytCardsToSgd, fetchYuyuTeiOp16Cards } from "@/lib/yuyu-tei-fetch";
import {
  fetchBandaiOp16EnglishNames,
  formatEnglishCardName,
  isOp16PriceListCard,
} from "@/lib/op16-english-names";
import { getYytJpyToSgdRate } from "@/lib/yuyu-tei-parser";

export type YytImportResult = {
  imported: number;
  rate: number;
  source: string;
};

/** OP16 import from YuYu-Tei retail prices (JPY → SGD). Price list only — not linked to inventory. */
export async function importYuyuTeiOp16Prices(workspaceId: string): Promise<YytImportResult> {
  const rate = getYytJpyToSgdRate();
  const lookup = await fetchBandaiOp16EnglishNames();
  const cards = (await fetchYuyuTeiOp16Cards()).filter((c) => isOp16PriceListCard(c.cardId));
  const priced = convertYytCardsToSgd(cards, rate);
  const now = new Date();

  for (const card of priced) {
    const englishName = formatEnglishCardName(lookup, card.cardId, card.variant, card.cardName);
    const identity = normalizeIdentity({
      itemType: "card",
      cardId: card.cardId,
      series: "OP16",
      rarity: card.rarity,
      variant: card.variant,
      language: "JP",
    });

    await prisma.cardPriceEntry.upsert({
      where: {
        workspaceId_itemType_cardId_series_rarity_variant_language: {
          workspaceId,
          ...identity,
        },
      },
      create: {
        workspaceId,
        ...identity,
        cardName: englishName,
        marketPriceSgd: card.priceSgd,
        priceUpdatedAt: now,
        inventoryItemId: null,
      },
      update: {
        cardName: englishName,
        marketPriceSgd: card.priceSgd,
        priceUpdatedAt: now,
        inventoryItemId: null,
      },
    });
  }

  return {
    imported: priced.length,
    rate,
    source: "https://yuyu-tei.jp/sell/opc/s/op16",
  };
}
