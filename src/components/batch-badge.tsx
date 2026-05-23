import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { TransactionBatchCategory } from "@/lib/transaction-codes";

const styles: Record<TransactionBatchCategory, string> = {
  txn: "bg-tan-dim text-tan border-tan/40",
  bc: "bg-brand-dim text-brand border-brand/40",
  other: "bg-surface-elevated text-muted border-border",
};

export function BatchBadge({
  category,
  children,
}: {
  category: TransactionBatchCategory;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
        styles[category]
      )}
    >
      {children}
    </span>
  );
}
