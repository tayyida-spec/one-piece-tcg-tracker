/**
 * Transaction ID conventions:
 * - TXN001, TXN002… — case breaks (buy case + sell pulls)
 * - BC001, BC002… — buy or sell individual cards (same ### for a buy/sell pair, e.g. BC006)
 */

export type TransactionBatchCategory = "txn" | "bc" | "other";

export function batchCategory(displayId: string): TransactionBatchCategory {
  const id = displayId.trim().toUpperCase();
  if (id.startsWith("TXN")) return "txn";
  if (id.startsWith("BC")) return "bc";
  return "other";
}

const CODE_PREFIX: Record<"txn" | "bc", string> = {
  txn: "TXN",
  bc: "BC",
};

export function nextCodeFromMax(prefix: "txn" | "bc", maxSuffix: number): string {
  const head = CODE_PREFIX[prefix];
  return `${head}${String(maxSuffix + 1).padStart(3, "0")}`;
}

/** Which prefix max values are needed to resolve this input (skip DB when user typed a full code). */
export function neededCodePrefixes(
  raw: string | undefined | null,
  transactionType: string,
  itemType: string | undefined
): { txn?: boolean; bc?: boolean } {
  const trimmed = raw?.trim() ?? "";
  const upper = trimmed.toUpperCase();
  if (upper === "TXN") return { txn: true };
  if (upper === "BC") return { bc: true };
  if (trimmed) return {};

  const type = transactionType.toLowerCase();
  if (type === "buy" && (itemType === "sealed" || itemType === "case")) {
    return { txn: true };
  }
  if (type === "buy") return { bc: true };
  return {};
}

export function resolveDisplayIdWithMax(
  raw: string | undefined | null,
  maxSuffixes: { txn: number; bc: number },
  transactionType: string,
  itemType: string | undefined
): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) {
    const type = transactionType.toLowerCase();
    if (type === "buy" && (itemType === "sealed" || itemType === "case")) {
      return nextCodeFromMax("txn", maxSuffixes.txn);
    }
    if (type === "buy") return nextCodeFromMax("bc", maxSuffixes.bc);
    return "";
  }
  const upper = trimmed.toUpperCase();
  if (upper === "TXN") return nextCodeFromMax("txn", maxSuffixes.txn);
  if (upper === "BC") return nextCodeFromMax("bc", maxSuffixes.bc);
  return trimmed;
}

export const BATCH_LABELS: Record<
  TransactionBatchCategory,
  { label: string; description: string }
> = {
  txn: {
    label: "TXN (case breaks)",
    description: "Case purchase + card sells from opening (TXN001, TXN002, …)",
  },
  bc: {
    label: "BC (buy / sell cards)",
    description: "Use the same BC### for buy and sell (e.g. BC006 buy, BC006 sell)",
  },
  other: {
    label: "Other",
    description: "IDs not using TXN or BC prefixes",
  },
};

export const TRANSACTION_ID_HINT =
  "Type TXN or BC alone for the next number (e.g. BC009). Reuse the same TXN/BC### for related buys and sells.";
