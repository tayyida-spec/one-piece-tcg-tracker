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

export function nextCodeForPrefix(prefix: "txn" | "bc", existingDisplayIds: string[]): string {
  const head = CODE_PREFIX[prefix];
  let max = 0;
  const re = new RegExp(`^${head}(\\d+)$`, "i");

  for (const raw of existingDisplayIds) {
    const m = raw.trim().match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }

  return `${head}${String(max + 1).padStart(3, "0")}`;
}

export function suggestDisplayId(
  transactionType: string,
  itemType: string | undefined,
  existingDisplayIds: string[]
): string | null {
  const type = transactionType.toLowerCase();
  if (type === "buy" && (itemType === "sealed" || itemType === "case")) {
    return nextCodeForPrefix("txn", existingDisplayIds);
  }
  if (type === "buy") return nextCodeForPrefix("bc", existingDisplayIds);
  return null;
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
  "TXN### = case break · BC### = buy or sell card (reuse same number for a pair). Editable in Transaction Log.";
