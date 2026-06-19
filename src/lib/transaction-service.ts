import type { z } from "zod";
import type { transactionSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import {
  applyQuantityDelta,
  findOrCreateInventoryItem,
  nextTransactionDisplayId,
} from "@/lib/inventory-service";
import { incrementPurchasePriceOnBuy } from "@/lib/inventory-cost-sync";
import { ensureUniqueImportKey } from "@/lib/transaction-import-key";
import { resolveDisplayIdAsync } from "@/lib/transaction-code-data";
import { toIsoDateString, parseApiDate } from "@/lib/date-format";

type TransactionInput = z.infer<typeof transactionSchema>;

export type CreatedTransaction = {
  id: string;
  displayId: string;
};

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
): Promise<CreatedTransaction> {
  const firstLineType = input.lines[0]?.itemType;
  const isoDate = toIsoDateString(input.date);
  if (!isoDate) {
    throw new Error("Invalid date — use DD/MM/YYYY");
  }

  return prisma.$transaction(async (tx) => {
    const displayId =
      (await resolveDisplayIdAsync(
        workspaceId,
        input.displayId,
        input.transactionType,
        firstLineType,
        tx
      )) || (await nextTransactionDisplayId(workspaceId));

    const importKey = await ensureUniqueImportKey(
      workspaceId,
      displayId,
      isoDate,
      input.transactionType,
      tx
    );

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
        const item = await findOrCreateInventoryItem(
          workspaceId,
          {
            itemType,
            cardName: line.cardName,
            cardId: line.cardId,
            series: line.series,
            rarity: line.rarity,
            language: line.language,
            variant: line.variant,
            owner: line.owner,
            notes: line.notes,
          },
          tx
        );
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
        await incrementPurchasePriceOnBuy(
          inventoryItemId,
          Number(line.quantity),
          Number(line.unitPrice),
          tx
        );
      }
    }

    return { id: transaction.id, displayId: transaction.displayId };
  });
}
