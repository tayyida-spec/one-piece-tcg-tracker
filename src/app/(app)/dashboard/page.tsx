import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { getCachedDashboardPayload } from "@/lib/dashboard-data";
import { resolveVisibleSections } from "@/lib/dashboard-sections";
import { formatDate, formatMoney } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { MonthlyPlDashboard } from "@/components/monthly-pl-dashboard";
import { DashboardSettings } from "@/components/dashboard-settings";
import { PageHeading, SectionHeading } from "@/components/page-heading";

export default async function DashboardPage() {
  const { workspaceId, membership } = await requireUser();
  const visible = resolveVisibleSections(membership.dashboardPrefs);

  const {
    transactionCount,
    inventoryCount,
    inStockCount,
    plData,
    plLines,
    inventorySnapshot,
    expenseSummary,
    recentTransactions,
  } = await getCachedDashboardPayload(workspaceId);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading
          title="Dashboard"
          description="Buy/Sell focus, portfolio ROI, expenses, and recent activity"
        />
        <div className="flex gap-2">
          <DashboardSettings initial={visible} />
          <Button asChild>
            <Link href="/quick-add">Quick add</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/inventory/new">Add card</Link>
          </Button>
        </div>
      </div>

      {visible.kpis && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Net cashflow" value={formatMoney(plData.netCashFlow)} hint="Sales − buys − expenses" />
          <StatCard label="In stock" value={String(inStockCount)} hint={`${inventoryCount} inventory rows`} />
          <StatCard label="Transactions" value={String(transactionCount)} />
          <StatCard label="Business expenses" value={formatMoney(plData.businessExpensesTotal)} hint={`${expenseSummary.count} record(s)`} />
        </div>
      )}

      <MonthlyPlDashboard
        data={plData}
        lines={plLines}
        inventory={inventorySnapshot}
        visible={visible}
      />

      {visible.expenses && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <SectionHeading title="Business expenses" />
            <Link href="/business-expenses" className="text-sm text-brand underline hover:text-brand-hover">
              Manage
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {formatMoney(expenseSummary.total)}
              </p>
              <p className="text-xs text-muted-foreground">{expenseSummary.count} record(s)</p>
            </div>
            {expenseSummary.byCategory.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {expenseSummary.byCategory.map((c) => (
                  <span
                    key={c.category}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-foreground"
                  >
                    {c.category}
                    <span className="font-semibold tabular-nums text-brand">{formatMoney(c.amount)}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {visible.recent && (
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
                      {t.lineCount} line(s) · {formatDate(t.date)}
                    </p>
                  </div>
                  <Link
                    href={`/transactions/${t.id}`}
                    className="text-brand underline hover:text-brand-hover"
                  >
                    View
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
