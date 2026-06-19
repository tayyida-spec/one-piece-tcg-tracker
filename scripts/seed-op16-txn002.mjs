/**
 * Seed OP16 Case Crack TXN002 inventory (inventory-only) + five 17 June sell transactions.
 * Usage: node scripts/seed-op16-txn002.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SELL_DATE = new Date("2026-06-17T00:00:00.000Z");
const SEED_TAG = "seed-op16-txn002";

function buildImportKey(displayId, date, transactionType, suffix = 1) {
  const datePart = date.toISOString().slice(0, 10);
  const base = `${displayId.trim()}|${datePart}|${transactionType.trim().toLowerCase()}`;
  return suffix <= 1 ? base : `${base}#${suffix}`;
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

/** OP16 case crack pulls — Mr.3 qty 6 (block 4 sells 4, block 5 sells 2) */
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
  { cardName: "Mr.3", cardId: "OP16-056", series: "OP16", rarity: "SR", price: 19.5, qty: 6 },
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

/** Five TXN002 sell transactions on 17 June — block 5 line totals sum to $40 + $3 smartpac = $43 */
const SELL_GROUPS = [
  {
    suffix: 1,
    smartpacFee: null,
    lines: [
      { cardName: "Mr.2 Bon Kurei", cardId: "OP16-055", series: "OP16", rarity: "R*", unitPrice: 15, qty: 1 },
      { cardName: "Moby Dick", cardId: "OP16-021", series: "OP16", rarity: "R*", unitPrice: 15, qty: 1 },
      { cardName: "Ivankov", cardId: "OP16-026", series: "OP16", rarity: "SR*", unitPrice: 12, qty: 1 },
    ],
  },
  {
    suffix: 2,
    smartpacFee: null,
    lines: [
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
    ],
  },
  {
    suffix: 3,
    smartpacFee: null,
    lines: [
      { cardName: "Sakazuki", cardId: "OP16-065", series: "OP16", rarity: "SR*", unitPrice: 30, qty: 1 },
    ],
  },
  {
    suffix: 4,
    smartpacFee: 3,
    lines: [
      { cardName: "Mr.3", cardId: "OP16-056", series: "OP16", rarity: "SR", unitPrice: 15, qty: 4 },
    ],
  },
  {
    suffix: 5,
    smartpacFee: 3,
    lines: [
      { cardName: "Mr.3", cardId: "OP16-056", series: "OP16", rarity: "SR", unitPrice: 14.5, qty: 2 },
      { cardName: "Ivankov", cardId: "OP16-026", series: "OP24", rarity: "SR", unitPrice: 4 / 3, qty: 3 },
      { cardName: "Buggy", cardId: "OP16-048", series: "OP19", rarity: "SR", unitPrice: 1.75, qty: 4 },
    ],
  },
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

async function applyDelta(tx, itemId, delta) {
  const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId } });
  const nextQty = Number(item.quantity) + delta;
  return tx.inventoryItem.update({
    where: { id: itemId },
    data: { quantity: nextQty, status: nextQty <= 0 ? "sold_out" : "in_stock" },
  });
}

async function reversePriorSeed(workspaceId) {
  const seeded = await prisma.transaction.findMany({
    where: {
      workspaceId,
      OR: [{ notes: { contains: SEED_TAG } }, { displayId: "TXN002", transactionType: "adjustment" }],
    },
    include: { lines: true },
  });

  if (seeded.length > 0) {
    console.log("Reversing", seeded.length, "prior TXN002 seed transaction(s)...");
    for (const txn of seeded) {
      for (const line of txn.lines) {
        if (!line.inventoryItemId) continue;
        const delta = txn.transactionType === "sell" ? Number(line.quantity) : -Number(line.quantity);
        await applyDelta(prisma, line.inventoryItemId, delta);
      }
    }
    await prisma.transaction.deleteMany({ where: { id: { in: seeded.map((t) => t.id) } } });
  }

  for (const row of CRACK_INVENTORY) {
    const item = await findItem(prisma, workspaceId, row);
    if (item?.notes?.includes("Case crack (TXN002)")) {
      await prisma.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: 0, status: "sold_out" },
      });
    }
  }
}

async function upsertCrackItem(tx, workspaceId, row) {
  const existing = await findItem(tx, workspaceId, row);
  const id = identity(row);
  if (existing) {
    return tx.inventoryItem.update({
      where: { id: existing.id },
      data: {
        cardName: row.cardName,
        purchasePrice: row.price,
        currentMarketPrice: row.price,
        notes: "Case crack (TXN002)",
      },
    });
  }
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

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) throw new Error("No workspace found");

  await reversePriorSeed(workspace.id);

  await prisma.$transaction(
    async (tx) => {
      for (const row of CRACK_INVENTORY) {
        const item = await upsertCrackItem(tx, workspace.id, row);
        await applyDelta(tx, item.id, row.qty);
      }
      console.log("Added", CRACK_INVENTORY.length, "case crack inventory rows (no adjustment txn)");

      for (const group of SELL_GROUPS) {
        const importKey = buildImportKey("TXN002", SELL_DATE, "sell", group.suffix);
        const sellTxn = await tx.transaction.create({
          data: {
            workspaceId: workspace.id,
            displayId: "TXN002",
            importKey,
            transactionType: "sell",
            date: SELL_DATE,
            currency: "SGD",
            smartpacFee: group.smartpacFee,
            notes: `${SEED_TAG} — 17 June sell block ${group.suffix}`,
          },
        });

        for (const line of group.lines) {
          const item = await findItem(tx, workspace.id, line);
          if (!item) throw new Error(`Missing inventory: ${line.cardName} ${line.cardId} ${line.series} ${line.rarity}`);
          if (Number(item.quantity) < line.qty) {
            throw new Error(
              `Insufficient ${line.cardName} (${line.series} ${line.rarity}): have ${item.quantity}, need ${line.qty}`
            );
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
              smartpacFee: group.smartpacFee,
              notes: line.notes ?? null,
            },
          });
        }
        console.log(
          `Sell TXN002 block ${group.suffix}: ${group.lines.length} line(s)` +
            (group.smartpacFee ? `, smartpac $${group.smartpacFee}` : "")
        );
      }
    },
    { maxWait: 30000, timeout: 120000 }
  );

  console.log("\nRemaining inventory after sells:");
  const check = [
    ["OP16-055", "OP16", "R*", "Mr.2"],
    ["OP16-021", "OP16", "R*", "Moby Dick"],
    ["OP16-026", "OP16", "SR*", "Ivankov SR*"],
    ["EB04-054", "OP16", "SP", "Kuma"],
    ["OP16-079", "OP16", "L*", "Yamato L*"],
    ["OP16-065", "OP16", "SR*", "Sakazuki SR*"],
    ["OP16-056", "OP16", "SR", "Mr.3 OP16"],
    ["OP16-026", "OP24", "SR", "Ivankov OP24"],
    ["OP16-048", "OP19", "SR", "Buggy OP19"],
  ];
  for (const [cardId, series, rarity, label] of check) {
    const item = await prisma.inventoryItem.findFirst({
      where: { workspaceId: workspace.id, cardId, series, rarity },
    });
    console.log(`  ${label}: qty=${item?.quantity ?? 0} (${item?.status ?? "n/a"})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
