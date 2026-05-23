import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/utils";
import { DataTable, Td } from "@/components/data-table";
import { DeleteTransactionButton } from "@/components/delete-transaction-button";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { workspaceId } = await requireUser();
  const { id } = await params;

  const transaction = await prisma.transaction.findFirst({
    where: { id, workspaceId },
    include: { lines: { include: { inventoryItem: true } } },
  });

  if (!transaction) notFound();

  const total = transaction.lines.reduce(
    (sum, line) => sum + Number(line.quantity) * Number(line.unitPrice),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-wide text-foreground">
            {transaction.displayId}
          </h2>
          <p className="text-sm text-muted">
            {formatDate(transaction.date)} · {transaction.transactionType} · {formatMoney(total)}
          </p>
          {transaction.batchLabel ? (
            <p className="text-sm text-muted">Batch: {transaction.batchLabel}</p>
          ) : null}
          {transaction.notes ? (
            <p className="mt-2 text-sm text-muted">{transaction.notes}</p>
          ) : null}
        </div>
        <DeleteTransactionButton id={transaction.id} />
      </div>

      <DataTable headers={["Card", "ID", "Qty", "Unit", "Line total", "Inventory"]}>
        {transaction.lines.map((line) => (
          <tr key={line.id}>
            <Td className="font-medium">{line.cardName}</Td>
            <Td>{line.cardId}</Td>
            <Td>{Number(line.quantity)}</Td>
            <Td>{formatMoney(Number(line.unitPrice))}</Td>
            <Td>{formatMoney(Number(line.quantity) * Number(line.unitPrice))}</Td>
            <Td>
              {line.inventoryItem ? (
                <Link
                  href={`/inventory/${line.inventoryItem.id}`}
                  className="text-brand underline hover:text-brand-hover"
                >
                  View
                </Link>
              ) : (
                "—"
              )}
            </Td>
          </tr>
        ))}
      </DataTable>

      <Link href="/transactions" className="text-sm text-brand underline hover:text-brand-hover">
        ← Back to transactions
      </Link>
    </div>
  );
}
