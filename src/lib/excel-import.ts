import * as XLSX from "xlsx";
import { normalizeIdentity } from "@/lib/inventory-identity";

export type ImportInventoryRow = {
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
  itemType: string;
};

export type ImportTransactionRow = {
  displayId: string;
  itemType: string;
  date: Date;
  cardName: string;
  cardId: string;
  series: string;
  rarity: string;
  transactionType: string;
  quantity: number;
  unitPrice: number;
  smartpacFee: number | null;
  owner: string | null;
  reimbursement: string | null;
  platform: string | null;
  notes: string | null;
};

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function cellNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    const parsed = XLSX.SSF.parse_date_code(v);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function normalizeTxnType(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t === "buy") return "buy";
  if (t === "sell") return "sell";
  if (t === "trade") return "trade";
  if (t === "gift") return "gift";
  return "adjustment";
}

function mapItemType(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t === "case" || t === "sealed") return "sealed";
  if (t === "merchandise") return "merchandise";
  return "card";
}

export function parseThreeHatsWorkbook(buffer: ArrayBuffer) {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });

  const inventory: ImportInventoryRow[] = [];
  const transactions: ImportTransactionRow[] = [];

  const invSheet = wb.Sheets["Cards Inventory"];
  if (invSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(invSheet, {
      defval: null,
    });
    for (const row of rows) {
      const cardId = cellStr(row["Card ID"]);
      const cardName = cellStr(row["Card Name"]);
      if (!cardId && !cardName) continue;

      const qty = cellNum(row["Quantity"]);
      if (qty <= 0 && cellStr(row["Inventory Status"]).toLowerCase() === "sold out") {
        // still import sold-out rows with 0 qty for history
      }

      inventory.push({
        cardName: cardName || cardId,
        cardId: cardId || cardName,
        series: cellStr(row["Series"]),
        rarity: cellStr(row["Rarity"]),
        quantity: qty,
        purchasePrice: row["Cost Used (SGD)"] != null ? cellNum(row["Cost Used (SGD)"]) : null,
        currentMarketPrice:
          row["Current Market Price (SGD)"] != null
            ? cellNum(row["Current Market Price (SGD)"])
            : row["Price Used (SGD)"] != null
              ? cellNum(row["Price Used (SGD)"])
              : null,
        condition: cellStr(row["Condition"]) || null,
        owner: cellStr(row["Owner"]) || null,
        notes: cellStr(row["Notes"]) || null,
        itemType: "card",
      });
    }
  }

  const txnSheet = wb.Sheets["Transaction Log"];
  if (txnSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(txnSheet, {
      defval: null,
    });
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

  return { inventory, transactions };
}

export function dedupeInventoryRows(rows: ImportInventoryRow[]) {
  const map = new Map<string, ImportInventoryRow>();

  for (const row of rows) {
    const key = [
      normalizeIdentity({
        itemType: row.itemType,
        cardId: row.cardId,
        series: row.series,
        rarity: row.rarity,
        variant: "",
        language: "JP",
      }).itemType,
      row.cardId,
      row.series,
      row.rarity,
    ].join("|");

    const existing = map.get(key);
    if (!existing || row.quantity > existing.quantity) {
      map.set(key, row);
    }
  }

  return [...map.values()];
}
