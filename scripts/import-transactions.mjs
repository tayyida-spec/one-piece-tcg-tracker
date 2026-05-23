/**
 * One-off import: Transaction Log + Cards Inventory from Three Hats Excel.
 * Usage: node scripts/import-transactions.mjs [path-to-xlsx]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const excelPath =
  process.argv[2] ||
  "c:\\Users\\Yi Da Tay\\Downloads\\Three Hats (1).xlsx";

function cellStr(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(v) {
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    const parsed = XLSX.SSF.parse_date_code(v);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function normalizeTxnType(raw) {
  const t = raw.trim().toLowerCase();
  if (t === "buy") return "buy";
  if (t === "sell") return "sell";
  if (t === "trade") return "trade";
  if (t === "gift") return "gift";
  return "adjustment";
}

function mapItemType(raw) {
  const t = raw.trim().toLowerCase();
  if (t === "case" || t === "sealed") return "sealed";
  if (t === "merchandise") return "merchandise";
  return "card";
}

function buildImportKey(displayId, date, transactionType) {
  const d = new Date(date);
  const datePart = Number.isNaN(d.getTime()) ? "unknown" : d.toISOString().slice(0, 10);
  return `${displayId.trim()}|${datePart}|${transactionType.trim().toLowerCase()}`;
}

function normalizeIdentity(input) {
  return {
    itemType: (input.itemType ?? "card").trim().toLowerCase(),
    cardId: (input.cardId ?? "").trim(),
    series: (input.series ?? "").trim(),
    rarity: (input.rarity ?? "").trim(),
    variant: (input.variant ?? "").trim(),
    language: (input.language ?? "JP").trim().toUpperCase(),
  };
}

function parseWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const transactions = [];

  const txnSheet = wb.Sheets["Transaction Log"];
  if (txnSheet) {
    const rows = XLSX.utils.sheet_to_json(txnSheet, { defval: null });
    for (const row of rows) {
      const cardId = cellStr(row["Card/Item ID"]);
      const cardName = cellStr(row["Card/Item Name"]);
      const txnType = cellStr(row["Transaction Type"]);
      if (!txnType || (!cardId && !cardName)) continue;

      transactions.push({
        displayId: cellStr(row["Transaction ID"]) || "IMPORT",
        itemType: mapItemType(cellStr(row["Item Type"])),
        date: parseDate(row["Date"]),
        cardName: cardName || cardId,
        cardId: cardId || cardName,
        series: cellStr(row["Series"]),
        rarity: cellStr(row["Rarity"]),
        transactionType: normalizeTxnType(txnType),
        quantity: cellNum(row["Quantity"]) || 1,
        unitPrice: cellNum(row["Unit Price (SGD)"]),
        smartpacFee: row["Smartpac (SGD)"] != null ? cellNum(row["Smartpac (SGD)"]) : null,
        owner: cellStr(row["Owner/Buyer/Seller"]) || null,
        reimbursement: cellStr(row["Reimbursement"]) || null,
        platform: cellStr(row["Platform"]) || null,
        notes: cellStr(row["Notes"]) || null,
      });
    }
  }

  return transactions;
}

function groupTransactions(transactions) {
  const grouped = new Map();
  for (const row of transactions) {
    const key = buildImportKey(row.displayId, row.date, row.transactionType);
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  }
  return grouped;
}

async function main() {
  if (!fs.existsSync(excelPath)) {
    console.error("Excel not found:", excelPath);
    process.exit(1);
  }

  const workspace = await prisma.workspace.findFirst({ orderBy: { createdAt: "asc" } });
  if (!workspace) {
    console.error("No workspace found. Sign up first via the app.");
    process.exit(1);
  }

  const workspaceId = workspace.id;
  console.log("Workspace:", workspace.name, workspaceId);

  const buffer = fs.readFileSync(excelPath);
  const transactions = parseWorkbook(buffer);
  console.log("Parsed transaction rows:", transactions.length);

  const ids = {};
  for (const t of transactions) {
    ids[t.displayId] = (ids[t.displayId] || 0) + 1;
  }
  console.log("By Transaction ID:", ids);

  await prisma.transaction.deleteMany({ where: { workspaceId } });
  console.log("Cleared existing transactions.");

  const grouped = groupTransactions(transactions);
  let groupsImported = 0;
  let linesImported = 0;

  for (const [importKey, lines] of grouped) {
    const first = lines[0];
    const displayId = first.displayId;

    const txn = await prisma.transaction.create({
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

      const item = await prisma.inventoryItem.upsert({
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

      await prisma.transactionLine.create({
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
      linesImported += 1;
    }

    groupsImported += 1;
    console.log(`Imported group ${importKey} (${lines.length} lines)`);
  }

  const totalLines = await prisma.transactionLine.count({
    where: { transaction: { workspaceId } },
  });

  console.log("\nDone!");
  console.log("Groups imported:", groupsImported);
  console.log("Lines imported:", linesImported);
  console.log("Total lines in DB:", totalLines);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
