/**
 * Seed OP16 / OP17 sell transactions (2 Oct 2026).
 * Sells sit under the case-break TXN they came from: OP16 → TXN002, OP17 → TXN003.
 * Buyers with cards from both cases get one sell row per case (same buyer in notes).
 * Idempotent: removes prior rows tagged seed-oct-op16-op17-sales.
 * Usage: node scripts/seed-oct-op16-op17-sales.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_TAG = "seed-oct-op16-op17-sales";
const SALE_DATE = dateUtc(2026, 10, 2);
const EXPECTED_TOTAL = 578;

const CASES = {
  OP16: { displayId: "TXN002", batchLabel: "OP16 case break" },
  OP17: { displayId: "TXN003", batchLabel: "OP17 Aug 2026" },
};

function dateUtc(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}

function buildImportKey(displayId, date, transactionType, suffix = 1) {
  const datePart = date.toISOString().slice(0, 10);
  const base = `${displayId.trim()}|${datePart}|${transactionType.trim().toLowerCase()}`;
  return suffix <= 1 ? base : `${base}#${suffix}`;
}

/** Quoted price is the line total; unit price = total ÷ qty. */
function line(cardName, cardId, lineTotal, qty = 1, extra = {}) {
  return {
    cardName,
    cardId: cardId || cardName.replace(/\s+/g, "-").slice(0, 40),
    rarity: extra.rarity ?? "",
    variant: extra.variant ?? "",
    quantity: qty,
    unitPrice: Math.round((lineTotal / qty) * 100) / 100,
    lineTotal,
    notes: extra.notes ?? null,
    reimbursement: extra.reimbursement ?? null,
  };
}

/**
 * @type {Array<{ key: string; buyer: string; expectedTotal: number; pendingMailing?: boolean;
 *   parts: Array<{ series: "OP16" | "OP17"; smartpacFee: number | null; lines: ReturnType<typeof line>[] }> }>}
 */
const BUYERS = [
  {
    key: "zack",
    buyer: "Zack",
    expectedTotal: 16.5,
    parts: [{ series: "OP16", smartpacFee: 2.5, lines: [line("Moby Dick AA", "Moby-Dick-AA", 14)] }],
  },
  {
    key: "fu-xiang",
    buyer: "Fu Xiang",
    expectedTotal: 65,
    parts: [
      { series: "OP17", smartpacFee: 3, lines: [line("Garp SP", "Garp-SP", 50)] },
      { series: "OP16", smartpacFee: null, lines: [line("Buggy Ldr AA", "Buggy-Ldr-AA", 12, 2)] },
    ],
  },
  {
    key: "yeow-keat",
    buyer: "Yeow Keat",
    expectedTotal: 45,
    parts: [
      {
        series: "OP17",
        smartpacFee: null,
        lines: [
          line("Shiki AA", "Shiki-AA", 30, 2),
          line("Red Pandaman", "Red-Pandaman", 6, 2),
          line("Yellow Pandaman", "Yellow-Pandaman", 9, 3),
        ],
      },
    ],
  },
  {
    key: "shun-lai",
    buyer: "Shun Lai",
    expectedTotal: 35,
    parts: [
      {
        series: "OP17",
        smartpacFee: null,
        lines: [
          line("Green CUR", "Green-CUR", 5),
          line("Black CUR", "Black-CUR", 5),
          line("Purple CUR", "Purple-CUR", 5),
          line("Luffy Gold Don", "Luffy-Gold-Don", 10),
          line("Emperor Gold Don", "Emperor-Gold-Don", 10),
        ],
      },
    ],
  },
  {
    key: "max-lau",
    buyer: "Max Lau",
    expectedTotal: 50,
    pendingMailing: true,
    parts: [
      {
        series: "OP16",
        smartpacFee: 3,
        lines: [
          line("Blue CUR", "Blue-CUR", 5),
          line("Green CUR", "Green-CUR", 5),
          line("Yamato AA", "Yamato-AA", 13),
        ],
      },
      { series: "OP17", smartpacFee: null, lines: [line("Lucky Roux TR", "Lucky-Roux-TR", 24, 3)] },
    ],
  },
  {
    key: "jin-hon",
    buyer: "Jin Hon",
    expectedTotal: 18,
    pendingMailing: true,
    parts: [
      {
        series: "OP16",
        smartpacFee: 3,
        lines: [
          line("Black CUR", "Black-CUR", 5),
          line("Yamato PS", "Yamato-PS", 5),
          line("Kinemon PS", "Kinemon-PS", 5),
        ],
      },
    ],
  },
  {
    key: "jeric",
    buyer: "Jeric",
    expectedTotal: 31,
    parts: [{ series: "OP16", smartpacFee: 3, lines: [line("Yamato Ldr AA", "Yamato-Ldr-AA", 28)] }],
  },
  {
    key: "tan-litek",
    buyer: "Tan Litek",
    expectedTotal: 8,
    parts: [{ series: "OP17", smartpacFee: 3, lines: [line("Yellow CUR", "Yellow-CUR", 5)] }],
  },
  {
    key: "shao-wei",
    buyer: "Shao Wei",
    expectedTotal: 100.5,
    parts: [
      {
        series: "OP16",
        smartpacFee: null,
        lines: [
          line("All CUR", "All-CUR", 30),
          line("Buggy SR PS", "Buggy-SR-PS", 5),
          line("Yamato SR PS", "Yamato-SR-PS", 5),
          line("Kinemon SR PS", "Kinemon-SR-PS", 5),
          line("Whitebeard SR PS", "Whitebeard-SR-PS", 5),
          line("Boa SR PS", "Boa-SR-PS", 6),
          line("Ivankov SR PS", "Ivankov-SR-PS", 5),
          line("Shiryu SR PS", "Shiryu-SR-PS", 5),
          line("Luffy SR", "Luffy-SR", 6, 3),
          line("Sakazuki SR PS", "Sakazuki-SR-PS", 5),
          line("Mr 3 SR", "Mr-3-SR", 7.5, 3),
          line("Prisoner", "Prisoner", 16, 8),
        ],
      },
    ],
  },
  {
    key: "ray-tan",
    buyer: "Ray Tan",
    expectedTotal: 18,
    parts: [
      {
        series: "OP17",
        smartpacFee: 3,
        lines: [
          line("Yellow CUR", "Yellow-CUR", 5),
          line("Blue CUR", "Blue-CUR", 5),
          line("Purple CUR", "Purple-CUR", 5),
        ],
      },
    ],
  },
  {
    key: "jian-cong",
    buyer: "Jian Cong",
    expectedTotal: 85,
    parts: [{ series: "OP16", smartpacFee: 3, lines: [line("SEC BB", "SEC-BB", 82, 4)] }],
  },
  {
    key: "dennis",
    buyer: "Dennis",
    expectedTotal: 25,
    parts: [
      {
        series: "OP17",
        smartpacFee: 3,
        lines: [
          line("Blue CUR", "Blue-CUR", 5),
          line("Yellow CUR", "Yellow-CUR", 5),
          line("Shiki PS", "Shiki-PS", 6),
          line("Gloriosa PS", "Gloriosa-PS", 6),
        ],
      },
    ],
  },
  {
    key: "hendrick",
    buyer: "Hendrick",
    expectedTotal: 8,
    parts: [{ series: "OP17", smartpacFee: 3, lines: [line("Yellow CUR", "Yellow-CUR", 5)] }],
  },
  {
    key: "john-lee",
    buyer: "John Lee",
    expectedTotal: 15,
    parts: [
      {
        series: "OP16",
        smartpacFee: null,
        lines: [
          line("Green CUR", "Green-CUR", 5),
          line("Blue CUR", "Blue-CUR", 5),
          line("Black CUR", "Black-CUR", 5),
        ],
      },
    ],
  },
  {
    key: "shah-rezan",
    buyer: "Shah Rezan",
    expectedTotal: 23,
    parts: [
      {
        series: "OP17",
        smartpacFee: 3,
        lines: [line("Blue CUR", "Blue-CUR", 5), line("Shiki AA", "Shiki-AA", 15)],
      },
    ],
  },
  {
    key: "muhd-anuar",
    buyer: "Muhd Anuar",
    expectedTotal: 35,
    parts: [
      {
        series: "OP16",
        smartpacFee: 3,
        lines: [
          line("Whitebeard SR", "Whitebeard-SR", 5, 4),
          line("Shiryu SR", "Shiryu-SR", 3, 2),
          line("Boa SR", "Boa-SR", 4, 2, { notes: "Listed as 'Boa SE' — logged as SR" }),
        ],
      },
      { series: "OP17", smartpacFee: null, lines: [line("Kaido AA", "Kaido-AA", 20, 2)] },
    ],
  },
];

function partTotal(part) {
  const lines = part.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  return lines + (part.smartpacFee ?? 0);
}

function buyerTotal(buyer) {
  return buyer.parts.reduce((s, p) => s + partTotal(p), 0);
}

function partNotes(buyer, partIndex) {
  const extras = [];
  if (buyer.pendingMailing) extras.push("Pending mailing");
  if (buyer.parts.length > 1) {
    const part = buyer.parts[partIndex];
    extras.push(`split ${partIndex + 1}/${buyer.parts.length}: ${part.series} cards`);
  }
  return `${SEED_TAG} — ${buyer.buyer}${extras.length ? ` (${extras.join("; ")})` : ""}`;
}

function validateTotals() {
  for (const buyer of BUYERS) {
    for (const part of buyer.parts) {
      for (const row of part.lines) {
        if (Math.abs(row.quantity * row.unitPrice - row.lineTotal) > 0.001) {
          throw new Error(`${buyer.buyer}: ${row.cardName} qty × unit ≠ line total`);
        }
      }
    }
    const total = buyerTotal(buyer);
    if (Math.abs(total - buyer.expectedTotal) > 0.001) {
      throw new Error(`${buyer.buyer}: computed S$${total.toFixed(2)} ≠ expected S$${buyer.expectedTotal}`);
    }
  }
  const grand = BUYERS.reduce((s, b) => s + buyerTotal(b), 0);
  if (Math.abs(grand - EXPECTED_TOTAL) > 0.001) {
    throw new Error(`Grand total S$${grand.toFixed(2)} ≠ expected S$${EXPECTED_TOTAL}`);
  }
}

async function findOrCreateItem(tx, workspaceId, row, series) {
  const identity = {
    itemType: "card",
    cardId: row.cardId,
    series,
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

/** Case-break singles aren't stocked individually, so quantity floors at 0 instead of going negative. */
async function applyDelta(tx, itemId, delta) {
  const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: itemId } });
  const nextQty = Math.max(0, Number(item.quantity) + delta);
  return tx.inventoryItem.update({
    where: { id: itemId },
    data: { quantity: nextQty, status: nextQty <= 0 ? "sold_out" : "in_stock" },
  });
}

async function reversePriorSeed(tx, workspaceId) {
  const seeded = await tx.transaction.findMany({
    where: { workspaceId, notes: { contains: SEED_TAG } },
    include: { lines: true },
  });
  if (!seeded.length) return;
  console.log(`Reversing ${seeded.length} prior seeded transaction(s)...`);
  for (const txn of seeded) {
    for (const lineRow of txn.lines) {
      if (!lineRow.inventoryItemId) continue;
      await applyDelta(tx, lineRow.inventoryItemId, Number(lineRow.quantity));
    }
  }
  await tx.transaction.deleteMany({ where: { id: { in: seeded.map((t) => t.id) } } });
}

async function main() {
  validateTotals();

  const workspace = await prisma.workspace.findFirst();
  if (!workspace) throw new Error("No workspace found");

  let txnCount = 0;
  let grandTotal = 0;
  const suffixByDisplayId = new Map();

  await prisma.$transaction(
    async (tx) => {
      await reversePriorSeed(tx, workspace.id);

      for (const buyer of BUYERS) {
        for (let p = 0; p < buyer.parts.length; p++) {
          const part = buyer.parts[p];
          const { displayId, batchLabel } = CASES[part.series];
          const suffix = (suffixByDisplayId.get(displayId) ?? 0) + 1;
          suffixByDisplayId.set(displayId, suffix);

          const sellTxn = await tx.transaction.create({
            data: {
              workspaceId: workspace.id,
              displayId,
              importKey: buildImportKey(displayId, SALE_DATE, "sell", suffix),
              batchLabel,
              transactionType: "sell",
              date: SALE_DATE,
              currency: "SGD",
              smartpacFee: part.smartpacFee,
              notes: partNotes(buyer, p),
            },
          });

          for (const row of part.lines) {
            const item = await findOrCreateItem(tx, workspace.id, row, part.series);
            await applyDelta(tx, item.id, -row.quantity);
            await tx.transactionLine.create({
              data: {
                transactionId: sellTxn.id,
                inventoryItemId: item.id,
                itemType: "card",
                cardName: row.cardName,
                cardId: row.cardId,
                series: part.series,
                rarity: row.rarity ?? "",
                variant: row.variant ?? "",
                quantity: row.quantity,
                unitPrice: row.unitPrice,
                smartpacFee: part.smartpacFee,
                notes: row.notes,
                reimbursement: row.reimbursement,
              },
            });
          }
          txnCount += 1;
        }

        const total = buyerTotal(buyer);
        grandTotal += total;
        console.log(`  ${buyer.key}: S$${total.toFixed(2)}${buyer.parts.length > 1 ? ` (${buyer.parts.length} rows)` : ""}`);
      }
    },
    { maxWait: 30000, timeout: 180000 }
  );

  console.log(`\nInserted ${txnCount} sell transaction row(s) for ${BUYERS.length} buyers on ${SALE_DATE.toISOString().slice(0, 10)}.`);
  console.log(`Seeded sales total (incl. mailing): S$${grandTotal.toFixed(2)}`);
  console.log(`Expected: S$${EXPECTED_TOTAL.toFixed(2)} — difference S$${(grandTotal - EXPECTED_TOTAL).toFixed(2)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
