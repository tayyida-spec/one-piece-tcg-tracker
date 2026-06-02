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
          description="Filter loaded rows below each header · use month filter or Load more for the full log"
        />
        <div className="flex flex-wrap gap-2">
          <ExportExcelButton />
          <Button asChild>
            <Link href="/transactions/new">New transaction</Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<TableSectionSkeleton />}>
        <TransactionLogSection />
      </Suspense>
    </div>
  );
}
