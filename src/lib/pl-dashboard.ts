/**
 * Monthly P/L — TXN (case breaks) and BC (card buy/sell by Transaction ID).
 * Fees are excluded from dashboard (still on transaction pages).
 */

import { batchCategory, BATCH_LABELS, type TransactionBatchCategory } from "@/lib/transaction-codes";
import { getWorkspaceTotalCapital } from "@/lib/workspace-capital";

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
  /** BC only — sum of open-position unrealized P/L */
  unrealizedPl?: number;
  remainingMarketValue?: number;
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
  /** Card quantity for this batch (BC: max of buy/sell qty, not summed). */
  qtyTraded: number;
  /** Realized P/L ÷ purchases (profit on cost). null when no purchases. */
  roiPct: number | null;
  /** Realized P/L ÷ sales (profit margin). null when no sales. */
  marginPct: number | null;
  /** BC only — current market price per card from inventory */
  currentMarketPrice?: number | null;
  /** BC only — unsold portion at current market vs buy cost */
  unrealizedPl?: number;
  /** BC only — unrealized P/L ÷ remaining cost basis (potential ROI on unsold). */
  unrealizedRoiPct?: number | null;
  remainingMarketValue?: number;
  remainingCostBasis?: number;
  remainingQty?: number;
  hasMarketPrice?: boolean;
};

export type PlInventoryInput = {
  id: string;
  itemType: string;
  cardId: string;
  series: string;
  rarity: string;
  variant: string;
  language: string;
  quantity: number;
  purchasePrice: number | null;
  currentMarketPrice: number | null;
  status: string;
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
  /** Unrealized P/L ÷ in-stock cost basis (portfolio potential ROI). */
  unrealizedRoiPct: number | null;
  totalMarketValue: number;
  totalCostBasis: number;
  inStockCount: number;
  /** BC batches with unsold cards — market − cost on remaining qty */
  bcUnrealizedPl: number;
  bcRemainingMarketValue: number;
  /** All buy line amounts across every transaction. */
  totalBuySpend: number;
  /** All sell line amounts across every transaction. */
  totalSellRevenue: number;
  /** Cost basis of units already sold. */
  soldCostBasis: number;
  /** Cash left in the pool = pumped-in capital − expenses − purchases + sales. */
  remainingCapital: number;
  /** Starting workspace cash pool (SGD). */
  workspaceTotalCapital: number;
  /** Purchase cost still in unsold stock = total buy spend − sold cost basis. */
  tiedUpInStock: number;
  /** All-time realized P/L (batch method, matches the per-batch tables). */
  realizedPlAll: number;
  /** Realized P/L ÷ total purchases. */
  roiPct: number | null;
  /** Realized P/L ÷ total sales. */
  marginPct: number | null;
  /** Sum of business expenses passed in. */
  businessExpensesTotal: number;
  /** Sales − purchases − business expenses. */
  netCashFlow: number;
  /** Realized P/L − business expenses. */
  netProfitAfterExpenses: number;
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
  allLines: PlLineInput[],
  inventoryById?: Map<string, PlInventoryInput>
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

  const qtyTraded = batchQtyTraded(groupLines, cat);

  const base: DisplayIdPlRow = {
    displayId,
    subtitle: deriveBatchSubtitle(displayId, groupLines),
    category: cat,
    buyTotal: round2(buyTotal),
    sellTotal: round2(sellTotal),
    realizedPl: round2(realizedPl),
    netCashFlow: round2(sellTotal - buyTotal),
    lineCount: groupLines.length,
    qtyTraded,
    roiPct: buyTotal > 0 ? round2((realizedPl / buyTotal) * 100) : null,
    marginPct: sellTotal > 0 ? round2((realizedPl / sellTotal) * 100) : null,
  };

  if (cat === "bc" && inventoryById) {
    const unrealized = bcUnrealizedForDisplayId(displayId, allLines, inventoryById);
    const market = bcCurrentMarketPriceForDisplayId(displayId, allLines, inventoryById);
    const costBasis = unrealized.remainingCostBasis ?? 0;
    const unrealizedRoiPct =
      costBasis > 0 && unrealized.hasMarketPrice
        ? round2(((unrealized.unrealizedPl ?? 0) / costBasis) * 100)
        : null;
    return { ...base, ...unrealized, ...market, unrealizedRoiPct };
  }

  return base;
}

/** BC qty = units in the deal (1 buy + 1 sell of same card → 1, not 2). */
function batchQtyTraded(groupLines: PlLineInput[], cat: TransactionBatchCategory): number {
  if (cat === "bc") {
    const buyQty = groupLines
      .filter((l) => l.transactionType.toLowerCase() === "buy")
      .reduce((s, l) => s + l.quantity, 0);
    const sellQty = groupLines
      .filter((l) => l.transactionType.toLowerCase() === "sell")
      .reduce((s, l) => s + l.quantity, 0);
    return round2(Math.max(buyQty, sellQty));
  }
  return round2(groupLines.reduce((s, l) => s + l.quantity, 0));
}

/** Current market price per card from linked inventory (includes sold cards). */
export function bcCurrentMarketPriceForDisplayId(
  displayId: string,
  allLines: PlLineInput[],
  inventoryById: Map<string, PlInventoryInput>
): Pick<DisplayIdPlRow, "currentMarketPrice" | "hasMarketPrice"> {
  const groupLines = allLines.filter((l) => l.displayId === displayId);
  if (batchCategory(displayId) !== "bc" || groupLines.length === 0) {
    return { currentMarketPrice: null, hasMarketPrice: false };
  }

  for (const line of groupLines) {
    if (!line.inventoryItemId) continue;
    const inv = inventoryById.get(line.inventoryItemId);
    if (inv?.currentMarketPrice != null && inv.currentMarketPrice > 0) {
      return {
        currentMarketPrice: round2(inv.currentMarketPrice),
        hasMarketPrice: true,
      };
    }
  }

  const anchor = groupLines.find((l) => l.transactionType.toLowerCase() === "buy") ?? groupLines[0];
  if (anchor) {
    const lineKey = identityKey(anchor);
    for (const inv of inventoryById.values()) {
      const invKey = inventoryIdentityKey(inv);
      if (invKey === lineKey && inv.currentMarketPrice != null && inv.currentMarketPrice > 0) {
        return {
          currentMarketPrice: round2(inv.currentMarketPrice),
          hasMarketPrice: true,
        };
      }
    }
  }

  return { currentMarketPrice: null, hasMarketPrice: false };
}

/** Unrealized P/L for a BC### batch — remaining buy qty × (market − cost). */
export function bcUnrealizedForDisplayId(
  displayId: string,
  allLines: PlLineInput[],
  inventoryById: Map<string, PlInventoryInput>
): Pick<
  DisplayIdPlRow,
  "unrealizedPl" | "remainingMarketValue" | "remainingCostBasis" | "remainingQty" | "hasMarketPrice"
> {
  const groupLines = allLines.filter((l) => l.displayId === displayId);
  if (batchCategory(displayId) !== "bc" || groupLines.length === 0) {
    return {
      unrealizedPl: 0,
      remainingMarketValue: 0,
      remainingCostBasis: 0,
      remainingQty: 0,
      hasMarketPrice: false,
    };
  }

  const byIdentity = new Map<string, PlLineInput[]>();
  for (const line of groupLines) {
    const key = line.inventoryItemId ?? identityKey(line);
    const bucket = byIdentity.get(key) ?? [];
    bucket.push(line);
    byIdentity.set(key, bucket);
  }

  let unrealizedPl = 0;
  let remainingMarketValue = 0;
  let remainingCostBasis = 0;
  let remainingQty = 0;
  let hasMarketPrice = false;

  for (const identityLines of byIdentity.values()) {
    const snapshot = bcUnrealizedForIdentityGroup(identityLines, inventoryById);
    unrealizedPl += snapshot.unrealizedPl;
    remainingMarketValue += snapshot.remainingMarketValue;
    remainingCostBasis += snapshot.remainingCostBasis;
    remainingQty += snapshot.remainingQty;
    hasMarketPrice = hasMarketPrice || snapshot.hasMarketPrice;
  }

  return {
    unrealizedPl: round2(unrealizedPl),
    remainingMarketValue: round2(remainingMarketValue),
    remainingCostBasis: round2(remainingCostBasis),
    remainingQty: round2(remainingQty),
    hasMarketPrice,
  };
}

function bcUnrealizedForIdentityGroup(
  groupLines: PlLineInput[],
  inventoryById: Map<string, PlInventoryInput>
): {
  unrealizedPl: number;
  remainingMarketValue: number;
  remainingCostBasis: number;
  remainingQty: number;
  hasMarketPrice: boolean;
} {
  const buys = groupLines.filter((l) => l.transactionType.toLowerCase() === "buy");
  const sells = groupLines.filter((l) => l.transactionType.toLowerCase() === "sell");

  const buyQty = buys.reduce((sum, line) => sum + line.quantity, 0);
  const sellQty = sells.reduce((sum, line) => sum + line.quantity, 0);
  const openQty = Math.max(0, buyQty - sellQty);

  if (openQty <= 0 || buys.length === 0) {
    return {
      unrealizedPl: 0,
      remainingMarketValue: 0,
      remainingCostBasis: 0,
      remainingQty: 0,
      hasMarketPrice: false,
    };
  }

  let totalBuyCost = 0;
  let totalBuyQty = 0;
  for (const buy of buys) {
    totalBuyCost += lineAmount(buy.quantity, buy.unitPrice);
    totalBuyQty += buy.quantity;
  }

  const costPerUnit = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;
  const costBasis = costPerUnit * openQty;

  const inventoryItemId = buys.find((line) => line.inventoryItemId)?.inventoryItemId;
  const inventory = inventoryItemId ? inventoryById.get(inventoryItemId) : undefined;
  const marketPerUnit =
    inventory?.currentMarketPrice != null && inventory.currentMarketPrice > 0
      ? inventory.currentMarketPrice
      : null;

  if (marketPerUnit == null) {
    return {
      unrealizedPl: 0,
      remainingMarketValue: 0,
      remainingCostBasis: round2(costBasis),
      remainingQty: openQty,
      hasMarketPrice: false,
    };
  }

  const marketValue = marketPerUnit * openQty;

  return {
    unrealizedPl: round2(marketValue - costBasis),
    remainingMarketValue: round2(marketValue),
    remainingCostBasis: round2(costBasis),
    remainingQty: openQty,
    hasMarketPrice: true,
  };
}

export function sumBcUnrealized(
  lines: PlLineInput[],
  inventoryById: Map<string, PlInventoryInput>
): { bcUnrealizedPl: number; bcRemainingMarketValue: number } {
  const displayIds = [
    ...new Set(lines.filter((line) => batchCategory(line.displayId) === "bc").map((line) => line.displayId)),
  ];

  let bcUnrealizedPl = 0;
  let bcRemainingMarketValue = 0;

  for (const displayId of displayIds) {
    const snapshot = bcUnrealizedForDisplayId(displayId, lines, inventoryById);
    bcUnrealizedPl += snapshot.unrealizedPl ?? 0;
    bcRemainingMarketValue += snapshot.remainingMarketValue ?? 0;
  }

  return {
    bcUnrealizedPl: round2(bcUnrealizedPl),
    bcRemainingMarketValue: round2(bcRemainingMarketValue),
  };
}

export function breakdownByDisplayId(
  lines: PlLineInput[],
  month?: string,
  inventoryById?: Map<string, PlInventoryInput>
): DisplayIdPlRow[] {
  const filtered = month ? lines.filter((l) => monthKey(l.date) === month) : lines;
  const displayIds = [...new Set(filtered.map((l) => l.displayId))].sort((a, b) => {
    const catA = batchCategory(a);
    const catB = batchCategory(b);
    const order = { txn: 0, bc: 1, other: 2 };
    if (order[catA] !== order[catB]) return order[catA] - order[catB];
    return a.localeCompare(b);
  });

  return displayIds.map((id) => batchPlForDisplayId(id, filtered, lines, inventoryById));
}

export function breakdownByBatchCategory(
  lines: PlLineInput[],
  month?: string,
  inventoryById?: Map<string, PlInventoryInput>
): BatchCategoryPlRow[] {
  const byDisplay = breakdownByDisplayId(lines, month, inventoryById);
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
      const unrealizedPl =
        category === "bc"
          ? round2(rows.reduce((s, r) => s + (r.unrealizedPl ?? 0), 0))
          : undefined;
      const remainingMarketValue =
        category === "bc"
          ? round2(rows.reduce((s, r) => s + (r.remainingMarketValue ?? 0), 0))
          : undefined;

      const row: BatchCategoryPlRow = {
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

      if (category === "bc") {
        row.unrealizedPl = unrealizedPl;
        row.remainingMarketValue = remainingMarketValue;
      }

      return row;
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

function inventoryIdentityKey(inv: PlInventoryInput): string {
  return [inv.itemType, inv.cardId, inv.series, inv.rarity, inv.variant, inv.language].join("|");
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
  inventory: PlInventoryInput[],
  businessExpensesTotal = 0
): PlDashboardData {
  const inventoryById = new Map(inventory.map((item) => [item.id, item]));
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

  const { bcUnrealizedPl, bcRemainingMarketValue } = sumBcUnrealized(lines, inventoryById);

  let totalBuySpend = 0;
  let totalSellRevenue = 0;
  let soldCostBasis = 0;
  for (const line of lines) {
    const amount = lineAmount(line.quantity, line.unitPrice);
    const type = line.transactionType.toLowerCase();
    if (type === "buy") {
      totalBuySpend += amount;
    } else if (type === "sell") {
      totalSellRevenue += amount;
      soldCostBasis += costBasisPerUnit(line, lines) * line.quantity;
    }
  }

  const realizedPlAll = round2(
    breakdownByDisplayId(lines).reduce((s, r) => s + r.realizedPl, 0)
  );
  const workspaceTotalCapital = getWorkspaceTotalCapital();
  const tiedUpInStock = round2(totalBuySpend - soldCostBasis);
  const remainingCapital = round2(
    workspaceTotalCapital - businessExpensesTotal - totalBuySpend + totalSellRevenue
  );
  const netCashFlow = round2(totalSellRevenue - totalBuySpend - businessExpensesTotal);
  const netProfitAfterExpenses = round2(realizedPlAll - businessExpensesTotal);
  const unrealizedPl = round2(totalMarket - totalCost);
  const unrealizedRoiPct =
    totalCost > 0 ? round2((unrealizedPl / totalCost) * 100) : null;

  return {
    months,
    unrealizedPl,
    unrealizedRoiPct,
    totalMarketValue: round2(totalMarket),
    totalCostBasis: round2(totalCost),
    inStockCount,
    bcUnrealizedPl,
    bcRemainingMarketValue,
    totalBuySpend: round2(totalBuySpend),
    totalSellRevenue: round2(totalSellRevenue),
    soldCostBasis: round2(soldCostBasis),
    remainingCapital,
    workspaceTotalCapital,
    tiedUpInStock,
    realizedPlAll,
    roiPct: totalBuySpend > 0 ? round2((realizedPlAll / totalBuySpend) * 100) : null,
    marginPct: totalSellRevenue > 0 ? round2((realizedPlAll / totalSellRevenue) * 100) : null,
    businessExpensesTotal: round2(businessExpensesTotal),
    netCashFlow,
    netProfitAfterExpenses,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
