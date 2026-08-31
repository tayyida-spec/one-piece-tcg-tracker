/**
 * Seed OP17 Aug 2026 sell transactions (24, 30, 31 Aug).
 * Idempotent: removes prior rows tagged seed-aug-op17-sales.
 * Usage: node scripts/seed-aug-op17-sales.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_TAG = "seed-aug-op17-sales";
const DISPLAY_ID = "BC007";
const BATCH_LABEL = "OP17 Aug 2026";

function dateUtc(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}

function buildImportKey(displayId, date, transactionType, suffix = 1) {
  const datePart = date.toISOString().slice(0, 10);
  const base = `${displayId.trim()}|${datePart}|${transactionType.trim().toLowerCase()}`;
  return suffix <= 1 ? base : `${base}#${suffix}`;
}

function line(cardName, cardId, unitPrice, qty = 1, extra = {}) {
  return {
    cardName,
    cardId: cardId || cardName.replace(/\s+/g, "-").slice(0, 40),
    series: extra.series ?? "OP17",
    rarity: extra.rarity ?? "",
    variant: extra.variant ?? "",
    quantity: qty,
    unitPrice,
    notes: extra.notes ?? null,
    reimbursement: extra.reimbursement ?? null,
  };
}

/** @type {Array<{ key: string; date: Date; notes: string; smartpacFee: number | null; lines: ReturnType<typeof line>[] }>} */
const SELL_GROUPS = [
  // ── Aug 24 ──
  {
    key: "nigel-ong",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — Nigel Ong`,
    smartpacFee: null,
    lines: [
      line("Shanks AA Ldr", "Shanks-AA-Ldr", 45),
      line("Big Mom AA Ldr", "Big-Mom-AA-Ldr", 20),
      line("Shanks SR PS", "Shanks-SR-PS", 40),
      line("Yasopp SR PS", "Yasopp-SR-PS", 8),
      line("Big Mom SR PS", "Big-Mom-SR-PS", 12),
    ],
  },
  {
    key: "zhenguang",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — ZhenGuang`,
    smartpacFee: 3,
    lines: [line("Yellow CUR", "Yellow-CUR", 25), line("Big Mom SR", "Big-Mom-SR", 12)],
  },
  {
    key: "gerard-seam",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — Gerard Seam`,
    smartpacFee: 3,
    lines: [
      line("Big Mom Ldr AA", "Big-Mom-Ldr-AA", 20),
      line("Kaido 10c AA", "Kaido-10c-AA", 30, 2),
      line("Lead Performer", "Lead-Performer", 13),
    ],
  },
  {
    key: "shaun-tan",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — Shaun Tan`,
    smartpacFee: 3,
    lines: [line("Rocks Don", "Rocks-Don", 1, 4)],
  },
  {
    key: "alvin-yan",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — Alvin Yan`,
    smartpacFee: 3,
    lines: [
      line("Beast Pirates", "Beast-Pirates", 13),
      line("Luffy Loki Don", "Luffy-Loki-Don", 0.5),
      line("Luffy My Plan Don", "Luffy-My-Plan-Don", 0.7),
      line("Four Emperor Don", "Four-Emperor-Don", 0.5),
      line("Rocks Don", "Rocks-Don", 1),
      line("Rounding", "Rounding", 0.2),
    ],
  },
  {
    key: "bryan",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — Bryan`,
    smartpacFee: 2,
    lines: [
      line("Shanks SR PS", "Shanks-SR-PS", 40),
      line("Yasopp SR PS", "Yasopp-SR-PS", 8),
      line("Whitebeard SR PS", "Whitebeard-SR-PS", 20),
      line("Rocks SEC PS", "Rocks-SEC-PS", 90),
      line("Loki SEC PS", "Loki-SEC-PS", 65),
    ],
  },
  {
    key: "jason",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — Jason`,
    smartpacFee: 3,
    lines: [
      line("Loki SEC", "Loki-SEC", 30),
      line("Black CUR", "Black-CUR", 25),
      line("Usopp SR", "Usopp-SR", 2.5, 3),
      line("Luffy SR PS", "Luffy-SR-PS", 20),
    ],
  },
  {
    key: "david-lee",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — David Lee (incl. Tiyo reimb -$14)`,
    smartpacFee: 2,
    lines: [
      line("Loki SEC PS", "Loki-SEC-PS", 39, 1, { notes: "Listed $55 less $14 Tiyo reimb" }),
      line("Luffy SR PS", "Luffy-SR-PS", 8),
      line("Kaido OP17-062 SR PS", "OP17-062", 5),
      line("Kaido OP17-063 SR PS", "OP17-063", 5),
      line("Usopp SR PS", "Usopp-SR-PS", 5),
    ],
  },
  {
    key: "low-fang-yu",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — Low Fang Yu`,
    smartpacFee: null,
    lines: [line("OP17 sale bundle", "OP17-BUNDLE-LFY", 126, 1, { notes: "Multi-card sale — total $126" })],
  },
  {
    key: "marcus-ng",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — Marcus Ng (incl. OP17 batch)`,
    smartpacFee: null,
    lines: [
      line("Purple CUR", "Purple-CUR", 25),
      line("Purple SR", "Purple-SR", 14),
      line("Kaido Ldr", "Kaido-Ldr", 21),
      line("Red CUR", "Red-CUR", 15),
      line("Whitebeard SR PS", "Wb-SR-PS", 8),
      line("Ace SEC", "Ace-SEC", 15, 3),
      line("Luffy SR PS", "Luffy-SR-PS", 6),
    ],
  },
  {
    key: "ben",
    date: dateUtc(2026, 8, 24),
    notes: `${SEED_TAG} — Ben`,
    smartpacFee: null,
    lines: [
      line("Big Mom AA", "Big-Mom-AA", 15, 2),
      line("3 Sweet Commander AA", "3-Sweet-Commander-AA", 20, 2),
    ],
  },
  // ── Aug 30 ──
  { key: "guo-qiang", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Guo Qiang (nego)`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-GQ", 131.5)] },
  { key: "yeow-keat", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Yeow Keat`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-YK", 47.5)] },
  { key: "jan-lee", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Jan Lee`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-JL", 36)] },
  { key: "keith-tan", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Keith Tan`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-KT", 13)] },
  { key: "daniel-ang", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Daniel Ang`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-DA", 73)] },
  { key: "mao-sheng", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Mao Sheng`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-MS", 61)] },
  { key: "irfan", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Irfan`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-IR", 52.5)] },
  { key: "song-yuan", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Song Yuan`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-SY", 15.5)] },
  { key: "william-oh", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — William Oh`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-WO", 155)] },
  { key: "andy-ng", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Andy Ng`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-AN", 37)] },
  { key: "yan-han", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Yan Han`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-YH", 19)] },
  { key: "andy-redfield", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Andy Redfield`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-AR", 31)] },
  { key: "luckbox", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Luckbox`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-LB", 69)] },
  { key: "jun-kit", date: dateUtc(2026, 8, 30), notes: `${SEED_TAG} — Jun Kit`, smartpacFee: null, lines: [line("OP17 sale bundle", "OP17-BUNDLE-JK", 58)] },
  // ── Aug 31 ──
  {
    key: "kang-ren",
    date: dateUtc(2026, 8, 31),
    notes: `${SEED_TAG} — Kang Ren`,
    smartpacFee: null,
    lines: [line("OP17 sale bundle", "OP17-BUNDLE-KR", 57.5)],
  },
];

function groupTotal(group) {
  const lines = group.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  return lines + (group.smartpacFee ?? 0);
}

async function findOrCreateItem(tx, workspaceId, row) {
  const identity = {
    itemType: "card",
    cardId: row.cardId,
    series: row.series ?? "",
    rarity: row.rarity ?? "",
    variant: row.variant ?? "",
    language: "JP",
  };
  const existing = await tx.inventoryItem.findUnique({
    where: { workspaceId_itemType_cardId_series_rarity_variant_language: { workspaceId, ...identity } },
  });
  if (existing) return existing;
  return tx.inventoryItem.create({
    data: {
      workspaceId,
      ...identity,
      cardName: row.cardName,
      quantity: 0,
      status: "sold_out",
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
    where: { workspaceId, notes: { contains: SEED_TAG } },
    include: { lines: true },
  });
  if (!seeded.length) return;
  console.log(`Reversing ${seeded.length} prior seeded transaction(s)...`);
  for (const txn of seeded) {
    for (const lineRow of txn.lines) {
      if (!lineRow.inventoryItemId) continue;
      await applyDelta(prisma, lineRow.inventoryItemId, Number(lineRow.quantity));
    }
  }
  await prisma.transaction.deleteMany({ where: { id: { in: seeded.map((t) => t.id) } } });
}

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) throw new Error("No workspace found");

  await reversePriorSeed(workspace.id);

  let txnCount = 0;
  let grandTotal = 0;

  await prisma.$transaction(
    async (tx) => {
      for (let i = 0; i < SELL_GROUPS.length; i++) {
        const group = SELL_GROUPS[i];
        const importKey = buildImportKey(DISPLAY_ID, group.date, "sell", i + 1);
        const sellTxn = await tx.transaction.create({
          data: {
            workspaceId: workspace.id,
            displayId: DISPLAY_ID,
            importKey,
            batchLabel: BATCH_LABEL,
            transactionType: "sell",
            date: group.date,
            currency: "SGD",
            smartpacFee: group.smartpacFee,
            notes: group.notes,
          },
        });

        for (const row of group.lines) {
          const item = await findOrCreateItem(tx, workspace.id, row);
          await applyDelta(tx, item.id, -row.quantity);
          await tx.transactionLine.create({
            data: {
              transactionId: sellTxn.id,
              inventoryItemId: item.id,
              itemType: "card",
              cardName: row.cardName,
              cardId: row.cardId,
              series: row.series ?? "",
              rarity: row.rarity ?? "",
              variant: row.variant ?? "",
              quantity: row.quantity,
              unitPrice: row.unitPrice,
              smartpacFee: group.smartpacFee,
              notes: row.notes,
              reimbursement: row.reimbursement,
            },
          });
        }

        const total = groupTotal(group);
        grandTotal += total;
        txnCount += 1;
        console.log(`  ${group.key}: S$${total.toFixed(2)}`);
      }
    },
    { maxWait: 30000, timeout: 120000 }
  );

  console.log(`\nInserted ${txnCount} sell transactions (${DISPLAY_ID}).`);
  console.log(`Seeded sales total: S$${grandTotal.toFixed(2)}`);
  console.log(`Expected: S$1532.40 (S$1474.90 + Kang Ren S$57.50)`);
  console.log(`Difference: S$${(grandTotal - 1532.4).toFixed(2)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
