import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  dedupeInventoryRows,
  parseThreeHatsWorkbook,
  type ImportTransactionRow,
} from "@/lib/excel-import";
import { normalizeIdentity } from "@/lib/inventory-identity";
import { buildTransactionImportKey } from "@/lib/transaction-import-key";

const BATCH_SIZE = 25;

async function upsertInventoryRow(
  workspaceId: string,
  row: {
    itemType: string;
    cardName: string;
    cardId: string;
    series: string;
    rarity: string;
    quantity: number;
    purchasePrice: number | null;
    currentMarketPrice: number | null;
    condition: string | null;
    owner: string | null;
    notes: string | null;
  }
) {
  const identity = normalizeIdentity({
    itemType: row.itemType,
    cardId: row.cardId,
    series: row.series,
    rarity: row.rarity,
    language: "JP",
    variant: "",
  });

  return prisma.inventoryItem.upsert({
    where: {
      workspaceId_itemType_cardId_series_rarity_variant_language: {
        workspaceId,
        ...identity,
      },
    },
    create: {
      workspaceId,
      ...identity,
      cardName: row.cardName,
      quantity: row.quantity,
      purchasePrice: row.purchasePrice,
      currentMarketPrice: row.currentMarketPrice,
      condition: row.condition,
      owner: row.owner,
      notes: row.notes,
      status: row.quantity > 0 ? "in_stock" : "sold_out",
    },
    update: {
      cardName: row.cardName,
      quantity: row.quantity,
      purchasePrice: row.purchasePrice,
      currentMarketPrice: row.currentMarketPrice,
      condition: row.condition,
      owner: row.owner,
      notes: row.notes,
      status: row.quantity > 0 ? "in_stock" : "sold_out",
    },
  });
}

function groupTransactions(transactions: ImportTransactionRow[]) {
  const grouped = new Map<string, ImportTransactionRow[]>();
  for (const row of transactions) {
    const key = buildTransactionImportKey(row.displayId, row.date, row.transactionType);
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  }
  return grouped;
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file");
    const replaceTransactions = formData.get("replaceTransactions") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const { inventory, transactions } = parseThreeHatsWorkbook(buffer);
    const inventoryRows = dedupeInventoryRows(inventory);

    let inventoryImported = 0;
    let transactionsImported = 0;
    let transactionsSkipped = 0;

    if (replaceTransactions) {
      await prisma.transaction.deleteMany({ where: { workspaceId } });
    }

    for (let i = 0; i < inventoryRows.length; i += BATCH_SIZE) {
      const batch = inventoryRows.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (row) => {
          if (!row.cardId && !row.cardName) return;
          await upsertInventoryRow(workspaceId, row);
          inventoryImported += 1;
        })
      );
    }

    const grouped = groupTransactions(transactions);

    for (const [importKey, lines] of grouped) {
      const first = lines[0];
      const displayId = first.displayId || `IMP-${Date.now()}`;

      if (!replaceTransactions) {
        const existing = await prisma.transaction.findUnique({
          where: {
            workspaceId_importKey: { workspaceId, importKey },
          },
        });
        if (existing) {
          transactionsSkipped += 1;
          continue;
        }
      }

      await prisma.$transaction(
        async (tx) => {
          const txn = await tx.transaction.create({
            data: {
              workspaceId,
              displayId,
              importKey,
              transactionType: first.transactionType,
              date: first.date,
              currency: "SGD",
              smartpacFee: first.smartpacFee,
              notes: first.notes,
            },
          });

          for (const line of lines) {
            const itemType = line.itemType;
            const identity = normalizeIdentity({
              itemType,
              cardId: line.cardId,
              series: line.series,
              rarity: line.rarity,
              language: "JP",
              variant: "",
            });

            const item = await tx.inventoryItem.upsert({
              where: {
                workspaceId_itemType_cardId_series_rarity_variant_language: {
                  workspaceId,
                  ...identity,
                },
              },
              create: {
                workspaceId,
                ...identity,
                cardName: line.cardName,
                quantity: 0,
                status: "sold_out",
              },
              update: {},
            });

            await tx.transactionLine.create({
              data: {
                transactionId: txn.id,
                inventoryItemId: item.id,
                itemType,
                cardName: line.cardName,
                cardId: line.cardId,
                series: line.series ?? "",
                rarity: line.rarity ?? "",
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                smartpacFee: line.smartpacFee,
                owner: line.owner,
                reimbursement: line.reimbursement,
                platform: line.platform,
                notes: line.notes,
              },
            });
          }
        },
        { maxWait: 10000, timeout: 30000 }
      );

      transactionsImported += 1;
    }

    const lineCount = await prisma.transactionLine.count({
      where: { transaction: { workspaceId } },
    });

    return NextResponse.json({
      inventoryImported,
      transactionsImported,
      transactionsSkipped,
      transactionLinesTotal: lineCount,
      inventoryParsed: inventory.length,
      transactionsParsed: transactions.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Import failed";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
