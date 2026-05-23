import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { getCachedTransactionLogRows } from "@/lib/transactions-data";
import { Button } from "@/components/ui/button";
import { TransactionLogTable } from "@/components/transaction-log-table";
import { PageHeading } from "@/components/page-heading";
import { TableSectionSkeleton } from "@/components/table-section-skeleton";

/** Client router cache: instant when switching back within 60s. */
export const unstable_dynamicStaleTime = 60;

async function TransactionLogSection() {
  const { workspaceId } = await requireUser();
  const rows = await getCachedTransactionLogRows(workspaceId);
  return <TransactionLogTable rows={rows} />;
}

export default function TransactionsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading
          title="Transaction Log"
          description="Filter any column — type in the box below each header"
        />
        <Button asChild>
          <Link href="/transactions/new">New transaction</Link>
        </Button>
      </div>

      <Suspense fallback={<TableSectionSkeleton />}>
        <TransactionLogSection />
      </Suspense>
    </div>
  );
}
