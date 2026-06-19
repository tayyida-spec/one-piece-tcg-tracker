/**
 * Seed OP16 Case Crack TXN002 inventory + 17 June 2026 sell transactions.
 * Usage: node scripts/seed-op16-txn002.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CRACK_DATE = new Date("2026-06-16T00:00:00.000Z");
const SELL_DATE = new Date("2026-06-17T00:00:00.000Z");
const SEED_TAG = "seed-op16-txn002";

function buildImportKey(displayId, date, transactionType) {
  const datePart = date.toISOString().slice(0, 10);
  return `${displayId.trim()}|${datePart}|${transactionType.trim().toLowerCase()}`;
}

function identity(row) {
  return {
    itemType: "card",
    cardId: (row.cardId ?? "").trim(),
    series: (row.series ?? "").trim(),
    rarity: (row.rarity ?? "").trim(),
    variant: "",
    language: "JP",
  };
}

const CRACK_INVENTORY = [
  { cardName: "Portgas D. Ace", cardId: "OP16-118", series: "OP16", rarity: "SEC*", price: 47, qty: 2 },
  { cardName: "Mr.2 Bon Kurei", cardId: "OP16-055", series: "OP16", rarity: "R*", price: 15, qty: 1 },
  { cardName: "Kuma", cardId: "EB04-054", series: "OP16", rarity: "SP", price: 118, qty: 1 },
  { cardName: "Teach", cardId: "OP16-119", series: "OP16", rarity: "SEC*", price: 118, qty: 1 },
  { cardName: "Gold Don", cardId: "Gold Don", series: "OP16", rarity: "", price: 7.5, qty: 1 },
  { cardName: "Sakazuki", cardId: "OP16-065", series: "OP16", rarity: "SR*", price: 31.5, qty: 1 },
  { cardName: "Ivankov", cardId: "OP16-026", series: "OP16", rarity: "SR*", price: 11.5, qty: 1 },
  { cardName: "Moby Dick", cardId: "OP16-021", series: "OP16", rarity: "R*", price: 15.5, qty: 1 },
  { cardName: "Buggy", cardId: "OP16-041", series: "OP16", rarity: "L*", price: 23.5, qty: 1 },
  { cardName: "Yamato", cardId: "OP16-098", series: "OP16", rarity: "SR*", price: 79.5, qty: 1 },
  { cardName: "Yamato", cardId: "OP16-079", series: "OP16", rarity: "L*", price: 158, qty: 1 },
  { cardName: "Teach", cardId: "OP16-119", series: "OP16", rarity: "SEC", price: 55.5, qty: 2 },
  { cardName: "Mr.3", cardId: "OP16-056", series: "OP16", rarity: "SR", price: 19.5, qty: 4 },
  { cardName: "Sakazuki", cardId: "OP16-065", series: "OP16", rarity: "SR", price: 31.5, qty: 3 },
  { cardName: "Kinemon", cardId: "OP16-082", series: "OP17", rarity: "SR", price: 6, qty: 5 },
  { cardName: "Yamato", cardId: "OP16-098", series: "OP18", rarity: "SR", price: 7.5, qty: 7 },
  { cardName: "Buggy", cardId: "OP16-048", series: "OP19", rarity: "SR", price: 2.5, qty: 6 },
  { cardName: "Shiryu", cardId: "OP16-108", series: "OP20", rarity: "SR", price: 2.5, qty: 8 },
  { cardName: "Edward Newgate", cardId: "OP16-003", series: "OP21", rarity: "SR", price: 1.5, qty: 6 },
  { cardName: "Monkey D Luffy", cardId: "OP16-015", series: "OP22", rarity: "SR", price: 3, qty: 3 },
  { cardName: "Ace", cardId: "OP16-118", series: "OP23", rarity: "SEC", price: 11.5, qty: 2 },
  { cardName: "Ivankov", cardId: "OP16-026", series: "OP24", rarity: "SR", price: 1.5, qty: 6 },
  { cardName: "Boa Hancock", cardId: "OP16-032", series: "OP25", rarity: "SR", price: 4, qty: 5 },
  { cardName: "Sakazuki", cardId: "OP16-065", series: "OP26", rarity: "SR", price: 3, qty: 4 },
];

/** 17 June sells — duplicate block at end of user list omitted (same 3 cards as first block) */
const SELL_LINES = [
  { cardName: "Mr.2 Bon Kurei", cardId: "OP16-055", series: "OP16", rarity: "R*", unitPrice: 15, qty: 1 },
  { cardName: "Moby Dick", cardId: "OP16-021", series: "OP16", rarity: "R*", unitPrice: 15, qty: 1 },
  { cardName: "Ivankov", cardId: "OP16-026", series: "OP16", rarity: "SR*", unitPrice: 12, qty: 1 },
  {
    cardName: "Kuma",
    cardId: "EB04-054",
    series: "OP16",
    rarity: "SP",
    unitPrice: 90,
    qty: 1,
    notes: "Refund -$10 for whitening (Goodwill)",
  },
  { cardName: "Yamato", cardId: "OP16-079", series: "OP16", rarity: "L*", unitPrice: 100, qty: 1 },
  { cardName: "Sakazuki", cardId: "OP16-065", series: "OP16", rarity: "SR*", unitPrice: 30, qty: 1 },
  { cardName: "Mr.3", cardId: "OP16-056", series: "OP16", rarity: "SR", unitPrice: 15, qty: 4 },
];

async function findItem(tx, workspaceId, row) {
  const id = identity(row);
  return tx.inventoryItem.findUnique({
    where: {
      workspaceId_itemType_cardId_series_rarity_variant_language: {
        workspaceId,
        ...id,
      },
    },
  });
}

async function upsertItem(tx, workspaceId, row) {
  const id = identity(row);
  const existing = await findItem(tx, workspaceId, row);
  if (existing) return existing;

  return tx.inventoryItem.create({
    data: {
      workspaceId,
      ...id,
      cardName: row.cardName,
      quantity: 0,
      purchasePrice: row.price,
      currentMarketPrice: row.price,
      notes: "Case crack (TXN002)",
      status: "in_stock",
    },
  });
}

async function applyDelta(tx, itemId, delta) {
  const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId } });
  const nextQty = Number(item.quantity) + delta;
  return tx.inventoryItem.update({
    where: { id: itemId },
    data: { quantity: nextQty, status: nextQty <= 0 ? "sold_out" : "in_stock" },
  });
}

async function reverseSeed(workspaceId) {
  const seeded = await prisma.transaction.findMany({
    where: { workspaceId, notes: { contains: SEED_TAG } },
    include: { lines: true },
  });
  if (seeded.length === 0) return;

  console.log("Reversing prior seed:", seeded.length, "transactions");
  for (const txn of seeded) {
    for (const line of txn.lines) {
      if (!line.inventoryItemId) continue;
      const delta = txn.transactionType === "sell" ? Number(line.quantity) : -Number(line.quantity);
      await applyDelta(prisma, line.inventoryItemId, delta);
    }
  }
  await prisma.transaction.deleteMany({ where: { id: { in: seeded.map((t) => t.id) } } });
}

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) throw new Error("No workspace found");

  await reverseSeed(workspace.id);

  await prisma.$transaction(
    async (tx) => {
      const crackKey = buildImportKey("TXN002", CRACK_DATE, "adjustment");
    const crackTxn = await tx.transaction.create({
      data: {
        workspaceId: workspace.id,
        displayId: "TXN002",
        importKey: crackKey,
        transactionType: "adjustment",
        date: CRACK_DATE,
        currency: "SGD",
        notes: `${SEED_TAG} — OP16 case crack inventory`,
        batchLabel: "OP16 Case Crack",
      },
    });

    for (const row of CRACK_INVENTORY) {
      const item = await upsertItem(tx, workspace.id, row);
      await applyDelta(tx, item.id, row.qty);
      await tx.transactionLine.create({
        data: {
          transactionId: crackTxn.id,
          inventoryItemId: item.id,
          itemType: "card",
          cardName: row.cardName,
          cardId: row.cardId,
          series: row.series,
          rarity: row.rarity,
          quantity: row.qty,
          unitPrice: row.price,
          notes: "Case crack (TXN002)",
        },
      });
    }
    console.log("Added", CRACK_INVENTORY.length, "case crack inventory lines (TXN002)");

    const sellKey = buildImportKey("TXN002", SELL_DATE, "sell");
    const sellTxn = await tx.transaction.create({
      data: {
        workspaceId: workspace.id,
        displayId: "TXN002",
        importKey: sellKey,
        transactionType: "sell",
        date: SELL_DATE,
        currency: "SGD",
        smartpacFee: 3,
        notes: `${SEED_TAG} — 17 June sells from OP16 case crack`,
      },
    });

    for (const line of SELL_LINES) {
      const item = await findItem(tx, workspace.id, line);
      if (!item) throw new Error(`Missing inventory: ${line.cardName} ${line.cardId}`);
      if (Number(item.quantity) < line.qty) {
        throw new Error(`Insufficient ${line.cardName}: have ${item.quantity}, need ${line.qty}`);
      }
      await applyDelta(tx, item.id, -line.qty);
      await tx.transactionLine.create({
        data: {
          transactionId: sellTxn.id,
          inventoryItemId: item.id,
          itemType: "card",
          cardName: line.cardName,
          cardId: line.cardId,
          series: line.series,
          rarity: line.rarity,
          quantity: line.qty,
          unitPrice: line.unitPrice,
          notes: line.notes ?? null,
        },
      });
    }
    console.log("Added", SELL_LINES.length, "sell lines (TXN002, 17 Jun 2026), smartpac $3");
    },
    { maxWait: 30000, timeout: 120000 }
  );

  console.log("\nSold cards — remaining qty:");
  for (const line of SELL_LINES) {
    const item = await findItem(prisma, workspace.id, line);
    console.log(`  ${line.cardName} (${line.cardId} ${line.rarity}): ${item?.quantity ?? 0}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
