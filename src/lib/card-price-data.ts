import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

import { cardPricesCacheTag } from "@/lib/cache-tags";

import { isSchemaNotReadyError } from "@/lib/safe-db";



export type CardPriceRow = {

  id: string;

  cardName: string;

  cardId: string;

  series: string;

  rarity: string;

  language: string;

  variant: string;

  marketPriceSgd: number | null;

  priceUpdatedAt: string | null;

};



async function loadCardPriceRows(workspaceId: string): Promise<CardPriceRow[]> {

  try {

    const rows = await prisma.cardPriceEntry.findMany({

      where: { workspaceId, itemType: "card" },

      orderBy: [{ series: "asc" }, { cardName: "asc" }, { rarity: "asc" }],

    });



    return rows.map((r) => ({

      id: r.id,

      cardName: r.cardName,

      cardId: r.cardId,

      series: r.series,

      rarity: r.rarity,

      language: r.language,

      variant: r.variant,

      marketPriceSgd:

        r.marketPriceSgd != null && Number(r.marketPriceSgd) > 0

          ? Number(r.marketPriceSgd)

          : null,

      priceUpdatedAt: r.priceUpdatedAt?.toISOString() ?? null,

    }));

  } catch (e) {

    if (isSchemaNotReadyError(e)) return [];

    throw e;

  }

}



export function getCachedCardPrices(workspaceId: string) {

  return unstable_cache(

    () => loadCardPriceRows(workspaceId),

    [cardPricesCacheTag(workspaceId)],

    { revalidate: 120, tags: [cardPricesCacheTag(workspaceId)] }

  )();

}


