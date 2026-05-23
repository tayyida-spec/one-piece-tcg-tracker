/**
 * Monthly P/L — TXN (case breaks) and BC (card buy/sell by Transaction ID).
 * Fees are excluded from dashboard (still on transaction pages).
 */

import { batchCategory, BATCH_LABELS, type TransactionBatchCategory } from "@/lib/transaction-codes";

export type { TransactionBatchCategory };

export type PlLineInput = {
  id: string;
  transactionId: string;
  displayId: string;
  cardName: string;
  transactionType: string;
  date: string;
  quantity: number;
  unitPrice: number;
  inventoryItemId: string | null;
  itemType: string;
  owner: string | null;
  cardId: string;
  series: string;
  rarity: string;
  variant: string;
  language: string;
  purchasePrice: number | null;
};

export type MonthlyPlRow = {
  month: string;
  label: string;
  buyTotal: number;
  sellTotal: number;
  realizedPl: number;
  netCashFlow: number;
  buyCount: number;
  sellCount: number;
};

export type BatchCategoryPlRow = {
  category: TransactionBatchCategory;
  label: string;
  description: string;
  buyTotal: number;
  sellTotal: number;
  realizedPl: number;
  netCashFlow: number;
  transactionCount: number;
  lineCount: number;
};

export type DisplayIdPlRow = {
  displayId: string;
  /** Shown in brackets, e.g. "OP15 Case", "Ace Manga" */
  subtitle: string | null;
  category: TransactionBatchCategory;
  buyTotal: number;
  sellTotal: number;
  realizedPl: number;
  netCashFlow: number;
  lineCount: number;
};

/** Human-readable label beside TXN### / BC### on the dashboard. */
export function deriveBatchSubtitle(
  displayId: string,
  groupLines: PlLineInput[]
): string | null {
  const cat = batchCategory(displayId);
  const buys = groupLines.filter((l) => l.transactionType.toLowerCase() === "buy");
  const sells = groupLines.filter((l) => l.transactionType.toLowerCase() === "sell");

  const pickName = (line: PlLineInput | undefined) => line?.cardName?.trim() || null;

  if (cat === "txn") {
    const caseLine =
      buys.find((l) => l.itemType === "sealed" || l.itemType === "case") ?? buys[0];
    return pickName(caseLine) ?? pickName(groupLines[0]);
  }

  if (cat === "bc") {
    return pickName(buys[0]) ?? pickName(sells[0]) ?? pickName(groupLines[0]);
  }

  return pickName(buys[0]) ?? pickName(sells[0]) ?? pickName(groupLines[0]);
}

export function formatDisplayIdLabel(displayId: string, subtitle: string | null): string {
  return subtitle ? `${displayId} (${subtitle})` : displayId;
}

export type PlDashboardData = {
  months: MonthlyPlRow[];
  unrealizedPl: number;
  totalMarketValue: number;
  totalCostBasis: number;
  inStockCount: number;
};

export function monthKey(date: string | Date): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "unknown";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthLabel(monthKey: string): string {
  if (monthKey === "unknown") return "Unknown";
  const [y, m] = monthKey.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return new Intl.DateTimeFormat("en-SG", { month: "short", year: "numeric" }).format(d);
}

export function lineAmount(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

/** Batch P/L per Transaction ID — sales − purchases (TXN and BC). */
export function batchPlForDisplayId(
  displayId: string,
  lines: PlLineInput[],
  allLines: PlLineInput[]
): DisplayIdPlRow {
  const groupLines = lines.filter((l) => l.displayId === displayId);
  const cat = batchCategory(displayId);
  let buyTotal = 0;
  let sellTotal = 0;
  let realizedPl = 0;

  if (cat === "txn" || cat === "bc") {
    for (const line of groupLines) {
      const amount = lineAmount(line.quantity, line.unitPrice);
      const type = line.transactionType.toLowerCase();
      if (type === "buy") buyTotal += amount;
      else if (type === "sell") sellTotal += amount;
    }
    realizedPl = sellTotal - buyTotal;
  } else {
    for (const line of groupLines) {
      const amount = lineAmount(line.quantity, line.unitPrice);
      const type = line.transactionType.toLowerCase();
      if (type === "buy") buyTotal += amount;
      else if (type === "sell") {
        sellTotal += amount;
        realizedPl += realizedPlForSellLine(line, allLines);
      }
    }
  }

  return {
    displayId,
    subtitle: deriveBatchSubtitle(displayId, groupLines),
    category: cat,
    buyTotal: round2(buyTotal),
    sellTotal: round2(sellTotal),
    realizedPl: round2(realizedPl),
    netCashFlow: round2(sellTotal - buyTotal),
    lineCount: groupLines.length,
  };
}

export function breakdownByDisplayId(lines: PlLineInput[], month?: string): DisplayIdPlRow[] {
  const filtered = month ? lines.filter((l) => monthKey(l.date) === month) : lines;
  const displayIds = [...new Set(filtered.map((l) => l.displayId))].sort((a, b) => {
    const catA = batchCategory(a);
    const catB = batchCategory(b);
    const order = { txn: 0, bc: 1, other: 2 };
    if (order[catA] !== order[catB]) return order[catA] - order[catB];
    return a.localeCompare(b);
  });

  return displayIds.map((id) => batchPlForDisplayId(id, filtered, lines));
}

export function breakdownByBatchCategory(
  lines: PlLineInput[],
  month?: string
): BatchCategoryPlRow[] {
  const byDisplay = breakdownByDisplayId(lines, month);
  const categories: TransactionBatchCategory[] = ["txn", "bc", "other"];

  return categories
    .map((category) => {
      const rows = byDisplay.filter((r) => r.category === category);
      if (rows.length === 0) return null;

      const meta = BATCH_LABELS[category];
      const transactionCount = new Set(
        (month ? lines.filter((l) => monthKey(l.date) === month) : lines)
          .filter((l) => batchCategory(l.displayId) === category)
          .map((l) => l.transactionId)
      ).size;

      const buyTotal = round2(rows.reduce((s, r) => s + r.buyTotal, 0));
      const sellTotal = round2(rows.reduce((s, r) => s + r.sellTotal, 0));
      const realizedPl = round2(rows.reduce((s, r) => s + r.realizedPl, 0));

      return {
        category,
        label: meta.label,
        description: meta.description,
        buyTotal,
        sellTotal,
        realizedPl,
        netCashFlow: round2(sellTotal - buyTotal),
        transactionCount: transactionCount || rows.length,
        lineCount: rows.reduce((s, r) => s + r.lineCount, 0),
      };
    })
    .filter((r): r is BatchCategoryPlRow => r != null);
}

function identityKey(line: PlLineInput): string {
  return [
    line.itemType,
    line.cardId,
    line.series,
    line.rarity,
    line.variant,
    line.language,
  ].join("|");
}

export function weightedAvgBuyCost(
  inventoryItemId: string,
  beforeDate: string,
  lines: PlLineInput[]
): number | null {
  const buys = lines.filter(
    (l) =>
      l.transactionType === "buy" &&
      l.inventoryItemId === inventoryItemId &&
      new Date(l.date).getTime() <= new Date(beforeDate).getTime()
  );
  if (buys.length === 0) return null;

  let totalQty = 0;
  let totalCost = 0;
  for (const b of buys) {
    totalQty += b.quantity;
    totalCost += lineAmount(b.quantity, b.unitPrice);
  }
  return totalQty > 0 ? totalCost / totalQty : null;
}

export function weightedAvgBuyCostByIdentity(
  identity: string,
  beforeDate: string,
  lines: PlLineInput[]
): number | null {
  const buys = lines.filter(
    (l) =>
      l.transactionType === "buy" &&
      identityKey(l) === identity &&
      new Date(l.date).getTime() <= new Date(beforeDate).getTime()
  );
  if (buys.length === 0) return null;

  let totalQty = 0;
  let totalCost = 0;
  for (const b of buys) {
    totalQty += b.quantity;
    totalCost += lineAmount(b.quantity, b.unitPrice);
  }
  return totalQty > 0 ? totalCost / totalQty : null;
}

export function costBasisPerUnit(line: PlLineInput, allLines: PlLineInput[]): number {
  if (line.purchasePrice != null && line.purchasePrice > 0) {
    return line.purchasePrice;
  }
  if (line.inventoryItemId) {
    const fromItem = weightedAvgBuyCost(line.inventoryItemId, line.date, allLines);
    if (fromItem != null) return fromItem;
  }
  const fromIdentity = weightedAvgBuyCostByIdentity(identityKey(line), line.date, allLines);
  return fromIdentity ?? 0;
}

export function realizedPlForSellLine(line: PlLineInput, allLines: PlLineInput[]): number {
  const revenue = lineAmount(line.quantity, line.unitPrice);
  const cost = costBasisPerUnit(line, allLines) * line.quantity;
  return revenue - cost;
}

export function buildPlDashboard(
  lines: PlLineInput[],
  inventory: { quantity: number; purchasePrice: number | null; currentMarketPrice: number | null; status: string }[]
): PlDashboardData {
  const monthMap = new Map<
    string,
    { buyTotal: number; sellTotal: number; buyCount: number; sellCount: number }
  >();

  function ensureMonth(key: string) {
    if (!monthMap.has(key)) {
      monthMap.set(key, { buyTotal: 0, sellTotal: 0, buyCount: 0, sellCount: 0 });
    }
    return monthMap.get(key)!;
  }

  for (const line of lines) {
    const key = monthKey(line.date);
    const bucket = ensureMonth(key);
    const amount = lineAmount(line.quantity, line.unitPrice);
    const type = line.transactionType.toLowerCase();

    if (type === "buy") {
      bucket.buyTotal += amount;
      bucket.buyCount += 1;
    } else if (type === "sell") {
      bucket.sellTotal += amount;
      bucket.sellCount += 1;
    }
  }

  const months: MonthlyPlRow[] = [...monthMap.entries()]
    .map(([month, b]) => {
      const monthLines = lines.filter((l) => monthKey(l.date) === month);
      const realizedPl = round2(
        breakdownByDisplayId(monthLines, month).reduce((s, r) => s + r.realizedPl, 0)
      );

      return {
        month,
        label: monthLabel(month),
        buyTotal: round2(b.buyTotal),
        sellTotal: round2(b.sellTotal),
        realizedPl,
        netCashFlow: round2(b.sellTotal - b.buyTotal),
        buyCount: b.buyCount,
        sellCount: b.sellCount,
      };
    })
    .sort((a, b) => b.month.localeCompare(a.month));

  let totalMarket = 0;
  let totalCost = 0;
  let inStockCount = 0;

  for (const item of inventory) {
    if (item.status !== "in_stock") continue;
    inStockCount += 1;
    const qty = item.quantity;
    totalMarket += qty * Number(item.currentMarketPrice ?? 0);
    totalCost += qty * Number(item.purchasePrice ?? 0);
  }

  return {
    months,
    unrealizedPl: round2(totalMarket - totalCost),
    totalMarketValue: round2(totalMarket),
    totalCostBasis: round2(totalCost),
    inStockCount,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
