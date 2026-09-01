/**
 * Migrate OP17 Aug sales from BC007 → TXN003, add TXN003 case buy (23 Aug), clear OP17 card inventory.
 * Usage: node scripts/migrate-op17-txn003.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_TAG = "seed-aug-op17-sales";
const OLD_DISPLAY_ID = "BC007";
const NEW_DISPLAY_ID = "TXN003";
const BUY_DATE = new Date("2026-08-23T00:00:00.000Z");
const BATCH_LABEL = "OP17 Aug 2026";

function remapImportKey(importKey) {
  if (importKey.startsWith(`${OLD_DISPLAY_ID}|`)) {
    return `${NEW_DISPLAY_ID}|${importKey.slice(`${OLD_DISPLAY_ID}|`.length)}`;
  }
  return importKey;
}

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) throw new Error("No workspace found");

  const sells = await prisma.transaction.findMany({
    where: { workspaceId: workspace.id, displayId: OLD_DISPLAY_ID, notes: { contains: SEED_TAG } },
    orderBy: { date: "asc" },
  });
  console.log(`Renaming ${sells.length} ${OLD_DISPLAY_ID} sell transaction(s) → ${NEW_DISPLAY_ID}`);

  for (const txn of sells) {
    const importKey = remapImportKey(txn.importKey);
    await prisma.transaction.update({
      where: { id: txn.id },
      data: {
        displayId: NEW_DISPLAY_ID,
        importKey,
        batchLabel: BATCH_LABEL,
      },
    });
  }

  const buyImportKey = `${NEW_DISPLAY_ID}|2026-08-23|buy`;
  const existingBuy = await prisma.transaction.findFirst({
    where: { workspaceId: workspace.id, importKey: buyImportKey },
  });

  if (!existingBuy) {
    const sealedIdentity = {
      itemType: "sealed",
      cardId: "OP17",
      series: "OP17",
      rarity: "",
      variant: "",
      language: "JP",
    };

    let sealedItem = await prisma.inventoryItem.findUnique({
      where: {
        workspaceId_itemType_cardId_series_rarity_variant_language: {
          workspaceId: workspace.id,
          ...sealedIdentity,
        },
      },
    });

    if (!sealedItem) {
      sealedItem = await prisma.inventoryItem.create({
        data: {
          workspaceId: workspace.id,
          ...sealedIdentity,
          cardName: "OP-17 Case",
          quantity: 0,
          purchasePrice: 0,
          status: "in_stock",
        },
      });
    }

    await prisma.$transaction(async (tx) => {
      const buyTxn = await tx.transaction.create({
        data: {
          workspaceId: workspace.id,
          displayId: NEW_DISPLAY_ID,
          importKey: buyImportKey,
          batchLabel: OP17_BATCH_LABEL,
          transactionType: "buy",
          date: BUY_DATE,
          currency: "SGD",
          notes: "2 cases OP17 — price TBD",
        },
      });

      await tx.transactionLine.create({
        data: {
          transactionId: buyTxn.id,
          inventoryItemId: sealedItem.id,
          itemType: "sealed",
          cardName: "OP-17 Case",
          cardId: "OP17",
          series: "OP17",
          quantity: 2,
          unitPrice: 0,
          notes: "Price TBD",
        },
      });

      const nextQty = Number(sealedItem.quantity) + 2;
      await tx.inventoryItem.update({
        where: { id: sealedItem.id },
        data: {
          quantity: nextQty,
          status: "in_stock",
          purchasePrice: 0,
        },
      });
    });

    console.log("Created TXN003 buy: 2× OP-17 Case on 2026-08-23 (price TBD)");
  } else {
    console.log("TXN003 buy already exists — skipped");
  }

  const cleared = await prisma.inventoryItem.updateMany({
    where: {
      workspaceId: workspace.id,
      itemType: "card",
      OR: [{ series: "OP17" }, { cardId: { startsWith: "OP17" } }],
    },
    data: { quantity: 0, status: "sold_out" },
  });
  console.log(`Cleared ${cleared.count} OP17 card inventory row(s)`);

  const txn003Count = await prisma.transaction.count({
    where: { workspaceId: workspace.id, displayId: NEW_DISPLAY_ID },
  });
  const bc007Left = await prisma.transaction.count({
    where: { workspaceId: workspace.id, displayId: OLD_DISPLAY_ID },
  });
  const op17InStock = await prisma.inventoryItem.count({
    where: {
      workspaceId: workspace.id,
      itemType: "card",
      OR: [{ series: "OP17" }, { cardId: { startsWith: "OP17" } }],
      quantity: { gt: 0 },
    },
  });

  console.log(`\nDone: ${txn003Count} TXN003 transaction(s), ${bc007Left} BC007 remaining, ${op17InStock} OP17 cards in stock`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
