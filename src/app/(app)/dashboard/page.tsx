import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { buildPlDashboard, type PlLineInput } from "@/lib/pl-dashboard";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MonthlyPlDashboard } from "@/components/monthly-pl-dashboard";
import { PageHeading, SectionHeading } from "@/components/page-heading";

export default async function DashboardPage() {
  const { workspaceId } = await requireUser();

  const [transactionCount, recentTransactions, lines, inStockItems] = await Promise.all([
      prisma.transaction.count({ where: { workspaceId } }),
      prisma.transaction.findMany({
        where: { workspaceId },
        orderBy: { date: "desc" },
        take: 5,
        include: { lines: true },
      }),
      prisma.transactionLine.findMany({
        where: { transaction: { workspaceId } },
        include: {
          transaction: true,
          inventoryItem: { select: { purchasePrice: true } },
        },
        orderBy: { transaction: { date: "asc" } },
      }),
      prisma.inventoryItem.findMany({
        where: { workspaceId, status: "in_stock" },
        select: {
          quantity: true,
          purchasePrice: true,
          currentMarketPrice: true,
          status: true,
        },
      }),
    ]);

  const plLines: PlLineInput[] = lines.map((line) => ({
    id: line.id,
    transactionId: line.transactionId,
    displayId: line.transaction.displayId,
    cardName: line.cardName,
    transactionType: line.transaction.transactionType,
    date: line.transaction.date.toISOString(),
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    inventoryItemId: line.inventoryItemId,
    itemType: line.itemType,
    owner: line.owner,
    cardId: line.cardId,
    series: line.series,
    rarity: line.rarity,
    variant: line.variant,
    language: line.language,
    purchasePrice:
      line.inventoryItem?.purchasePrice != null
        ? Number(line.inventoryItem.purchasePrice)
        : null,
  }));

  const plData = buildPlDashboard(
    plLines,
    inStockItems.map((i) => ({
      quantity: Number(i.quantity),
      purchasePrice: i.purchasePrice != null ? Number(i.purchasePrice) : null,
      currentMarketPrice:
        i.currentMarketPrice != null ? Number(i.currentMarketPrice) : null,
      status: i.status,
    }))
  );

  const inventoryCount = await prisma.inventoryItem.count({ where: { workspaceId } });
  const inStockCount = plData.inStockCount;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading
          title="Dashboard"
          description="Monthly P/L, portfolio snapshot, and recent activity"
        />
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/quick-add">Quick add</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/inventory/new">Add card</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Inventory rows" value={String(inventoryCount)} />
        <StatCard label="In stock" value={String(inStockCount)} />
        <StatCard label="Transactions" value={String(transactionCount)} />
      </div>

      <MonthlyPlDashboard data={plData} lines={plLines} />

      <section>
        <div className="mb-3">
          <SectionHeading title="Recent transactions" />
        </div>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {recentTransactions.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">No transactions yet.</li>
          ) : (
            recentTransactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    {t.displayId} · {t.transactionType}
                  </p>
                  <p className="text-muted">
                    {t.lines.length} line(s) · {formatDate(t.date)}
                  </p>
                </div>
                <Link href={`/transactions/${t.id}`} className="text-brand underline hover:text-brand-hover">
                  View
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
