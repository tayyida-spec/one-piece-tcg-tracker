import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import {
  loadTransactionLogPage,
  loadTransactionLogMonths,
  TRANSACTION_LOG_PAGE_SIZE,
} from "@/lib/transactions-data";
import { Button } from "@/components/ui/button";
import { TransactionLogPanel } from "@/components/transaction-log-panel";
import { ExportExcelButton } from "@/components/export-excel-button";
import { PageHeading } from "@/components/page-heading";
import { TableSectionSkeleton } from "@/components/table-section-skeleton";

async function TransactionLogSection() {
  const { workspaceId } = await requireUser();
  const [initialPage, months] = await Promise.all([
    loadTransactionLogPage(workspaceId, { limit: TRANSACTION_LOG_PAGE_SIZE, offset: 0 }),
    loadTransactionLogMonths(workspaceId),
  ]);

  return <TransactionLogPanel initialPage={initialPage} months={months} />;
}

export default function TransactionsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading
          title="Transaction Log"
          description="Buys, sells, and trades — case cracks are inventory-only (see below)"
        />
        <div className="flex flex-wrap gap-2">
          <ExportExcelButton />
          <Button asChild>
            <Link href="/transactions/new">New transaction</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4 text-sm">
        <p className="font-medium text-foreground">How cases &amp; inventory relate</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
          <li>
            <strong className="text-foreground">Buy a sealed case</strong> — use{" "}
            <Link href="/transactions/new" className="text-brand underline-offset-2 hover:underline">
              New transaction
            </Link>{" "}
            (Buy, sealed) or add via Inventory with &quot;Log as transaction&quot; checked.
          </li>
          <li>
            <strong className="text-foreground">Crack a case</strong> —{" "}
            <Link href="/case-crack" className="text-brand underline-offset-2 hover:underline">
              Case crack
            </Link>{" "}
            page (case stays on Inventory as <em>Cracked</em>, singles +qty). Does not appear here.
          </li>
          <li>
            <strong className="text-foreground">Sell pulls</strong> — Quick add or New transaction (Sell) under the same TXN ID.
          </li>
        </ul>
      </div>

      <Suspense fallback={<TableSectionSkeleton />}>
        <TransactionLogSection />
      </Suspense>
    </div>
  );
}
