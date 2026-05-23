import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  TransactionLogTable,
  type TransactionLogRow,
} from "@/components/transaction-log-table";
import { PageHeading } from "@/components/page-heading";

export default async function TransactionsPage() {
  const { workspaceId } = await requireUser();

  const lines = await prisma.transactionLine.findMany({
    where: { transaction: { workspaceId } },
    include: { transaction: true },
    orderBy: [
      { transaction: { date: "desc" } },
      { transaction: { displayId: "asc" } },
      { cardName: "asc" },
    ],
  });

  const rows: TransactionLogRow[] = lines.map((line) => ({
    id: line.id,
    itemType: line.itemType,
    cardName: line.cardName,
    cardId: line.cardId,
    series: line.series,
    rarity: line.rarity,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    smartpacFee: line.smartpacFee != null ? Number(line.smartpacFee) : null,
    owner: line.owner,
    reimbursement: line.reimbursement,
    platform: line.platform,
    notes: line.notes,
    transaction: {
      id: line.transaction.id,
      displayId: line.transaction.displayId,
      transactionType: line.transaction.transactionType,
      date: line.transaction.date.toISOString(),
      smartpacFee:
        line.transaction.smartpacFee != null ? Number(line.transaction.smartpacFee) : null,
    },
  }));

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

      <TransactionLogTable rows={rows} />
    </div>
  );
}
