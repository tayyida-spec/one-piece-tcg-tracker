import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeIdentity } from "@/lib/inventory-identity";
import { applyQuantityDelta } from "@/lib/inventory-service";
import type { z } from "zod";
import type { caseCrackSchema } from "@/lib/validations";
import type { CrackableCase } from "@/lib/case-crack-types";

export type { CrackableCase };

type CaseCrackInput = z.infer<typeof caseCrackSchema>;

async function findOrCreateInTx(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  data: {
    cardName: string;
    cardId: string;
    series?: string;
    rarity?: string;
    language?: string;
    variant?: string;
    notes?: string | null;
  }
) {
  const identity = normalizeIdentity({
    itemType: "card",
    cardId: data.cardId || data.cardName,
    series: data.series,
    rarity: data.rarity,
    language: data.language,
    variant: data.variant,
  });

  const existing = await tx.inventoryItem.findUnique({
    where: {
      workspaceId_itemType_cardId_series_rarity_variant_language: {
        workspaceId,
        ...identity,
      },
    },
  });

  if (existing) return existing;

  return tx.inventoryItem.create({
    data: {
      workspaceId,
      ...identity,
      itemType: "card",
      cardName: data.cardName.trim(),
      notes: data.notes ?? null,
      quantity: 0,
      status: "in_stock",
    },
  });
}

function crackNote(referenceTxn: string | null | undefined, notes: string | null | undefined) {
  const bits: string[] = [];
  if (referenceTxn?.trim()) bits.push(`Case crack (${referenceTxn.trim().toUpperCase()})`);
  if (notes?.trim()) bits.push(notes.trim());
  return bits.length > 0 ? bits.join(" — ") : null;
}

export async function loadCrackableCases(workspaceId: string): Promise<CrackableCase[]> {
  const items = await prisma.inventoryItem.findMany({
    where: {
      workspaceId,
      itemType: { in: ["sealed", "case"] },
      status: "in_stock",
      quantity: { gte: 1 },
    },
    orderBy: { cardName: "asc" },
    select: {
      id: true,
      cardName: true,
      cardId: true,
      series: true,
      quantity: true,
    },
  });

  const enriched = await Promise.all(
    items.map(async (item) => {
      const buyLine = await prisma.transactionLine.findFirst({
        where: {
          inventoryItemId: item.id,
          transaction: {
            workspaceId,
            transactionType: "buy",
            displayId: { startsWith: "TXN", mode: "insensitive" },
          },
        },
        include: { transaction: { select: { displayId: true } } },
        orderBy: { transaction: { date: "desc" } },
      });

      return {
        id: item.id,
        cardName: item.cardName,
        cardId: item.cardId,
        series: item.series,
        quantity: Number(item.quantity),
        suggestedTxn: buyLine?.transaction.displayId ?? null,
      };
    })
  );

  return enriched;
}

export async function crackCase(workspaceId: string, input: CaseCrackInput) {
  const sharedNote = crackNote(input.referenceTxn, input.notes);

  return prisma.$transaction(async (tx) => {
    const sealed = await tx.inventoryItem.findFirst({
      where: {
        id: input.sealedItemId,
        workspaceId,
        itemType: { in: ["sealed", "case"] },
      },
    });

    if (!sealed) {
      throw new Error("Case not found");
    }
    if (sealed.status !== "in_stock") {
      throw new Error("Case is already cracked or sold");
    }
    if (Number(sealed.quantity) < 1) {
      throw new Error("Case is not in stock");
    }

    const currentNotes = sealed.notes?.trim() ?? "";
    const crackedNotes = sharedNote
      ? currentNotes
        ? `${currentNotes} — ${sharedNote}`
        : sharedNote
      : currentNotes;

    const qty = Number(sealed.quantity);
    if (qty > 1) {
      await applyQuantityDelta(sealed.id, -1, tx);
    } else {
      await tx.inventoryItem.update({
        where: { id: sealed.id },
        data: {
          status: "cracked",
          notes: crackedNotes || null,
        },
      });
    }

    const added: { cardName: string; cardId: string; quantity: number }[] = [];

    for (const line of input.lines) {
      const lineNote = line.notes?.trim() || sharedNote;
      const cardId = line.cardId.trim() || line.cardName.trim();

      const item = await findOrCreateInTx(tx, workspaceId, {
        cardName: line.cardName,
        cardId,
        series: line.series,
        rarity: line.rarity,
        language: line.language,
        variant: line.variant,
        notes: lineNote,
      });

      const qty = Number(line.quantity);
      await applyQuantityDelta(item.id, qty, tx);
      added.push({ cardName: line.cardName, cardId, quantity: qty });
    }

    return {
      caseName: sealed.cardName,
      cardsAdded: added.length,
      totalUnits: added.reduce((s, r) => s + r.quantity, 0),
      referenceTxn: input.referenceTxn?.trim().toUpperCase() ?? null,
    };
  });
}
