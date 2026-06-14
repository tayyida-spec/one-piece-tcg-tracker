import type { z } from "zod";
import type { transactionSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import {
  applyQuantityDelta,
  findOrCreateInventoryItem,
  nextTransactionDisplayId,
} from "@/lib/inventory-service";
import { recalcInventoryPurchasePrice } from "@/lib/inventory-cost-sync";
import { buildTransactionImportKey } from "@/lib/transaction-import-key";
import { suggestDisplayId } from "@/lib/transaction-codes";
import { toIsoDateString, parseApiDate } from "@/lib/date-format";

type TransactionInput = z.infer<typeof transactionSchema>;

function quantityDeltaForType(type: string, qty: number) {
  switch (type) {
    case "buy":
      return qty;
    case "sell":
    case "gift":
      return -qty;
    case "trade":
      return 0;
    default:
      return qty;
  }
}

export async function createTransaction(
  workspaceId: string,
  userId: string,
  input: TransactionInput
) {
  const existingIds = (
    await prisma.transaction.findMany({
      where: { workspaceId },
      select: { displayId: true },
    })
  ).map((t) => t.displayId);

  const firstLineType = input.lines[0]?.itemType;
  const displayId =
    input.displayId?.trim() ||
    suggestDisplayId(input.transactionType, firstLineType, existingIds) ||
    (await nextTransactionDisplayId(workspaceId));

  const isoDate = toIsoDateString(input.date);
  if (!isoDate) {
    throw new Error("Invalid date — use DD/MM/YYYY");
  }

  const importKey = buildTransactionImportKey(
    displayId,
    isoDate,
    input.transactionType
  );

  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        workspaceId,
        displayId,
        importKey,
        batchLabel: input.batchLabel ?? null,
        transactionType: input.transactionType,
        date: parseApiDate(isoDate),
        currency: "SGD",
        smartpacFee: input.smartpacFee ?? null,
        notes: input.notes ?? null,
        createdBy: userId,
      },
    });

    for (const line of input.lines) {
      const itemType =
        line.itemType === "case" ? "sealed" : line.itemType === "card" ? "card" : line.itemType;

      let inventoryItemId = line.inventoryItemId ?? null;

      if (!inventoryItemId) {
        const item = await findOrCreateInventoryItem(workspaceId, {
          itemType,
          cardName: line.cardName,
          cardId: line.cardId,
          series: line.series,
          rarity: line.rarity,
          language: line.language,
          variant: line.variant,
          owner: line.owner,
          notes: line.notes,
        });
        inventoryItemId = item.id;
      }

      await tx.transactionLine.create({
        data: {
          transactionId: transaction.id,
          inventoryItemId,
          itemType,
          cardName: line.cardName,
          cardId: line.cardId,
          series: line.series ?? "",
          rarity: line.rarity ?? "",
          language: line.language ?? "JP",
          variant: line.variant ?? "",
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          smartpacFee: input.smartpacFee ?? null,
          owner: line.owner ?? null,
          notes: line.notes ?? null,
        },
      });

      const delta = quantityDeltaForType(input.transactionType, Number(line.quantity));
      if (delta !== 0 && inventoryItemId) {
        await applyQuantityDelta(inventoryItemId, delta, tx);
      }

      if (input.transactionType === "buy" && inventoryItemId) {
        await recalcInventoryPurchasePrice(inventoryItemId, tx);
      }
    }

    return tx.transaction.findUniqueOrThrow({
      where: { id: transaction.id },
      include: { lines: { include: { inventoryItem: true } } },
    });
  });
}
