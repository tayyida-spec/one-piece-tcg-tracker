"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthlyPlDashboard } from "@/components/monthly-pl-dashboard";
import { PageHeading, SectionHeading } from "@/components/page-heading";
import { DashboardLayoutEditor } from "@/components/dashboard/dashboard-layout-editor";
import {
  isPlSectionKey,
  layoutToPrefs,
  orderForPlSections,
  type DashboardLayout,
  type DashboardSectionKey,
} from "@/lib/dashboard-sections";
import type { DashboardPayload } from "@/lib/dashboard-data";
import type {
  PlDashboardData,
  PlInventoryInput,
  PlLineInput,
} from "@/lib/pl-dashboard";
import type { ExpenseSummary } from "@/lib/dashboard-data";
import { formatDate, formatMoney } from "@/lib/utils";

export type DashboardShellProps = {
  initialLayout: DashboardLayout;
  transactionCount: number;
  inventoryCount: number;
  inStockCount: number;
  plData: PlDashboardData;
  plLines: PlLineInput[];
  inventorySnapshot: PlInventoryInput[];
  expenseSummary: ExpenseSummary;
  recentTransactions: DashboardPayload["recentTransactions"];
};

export function DashboardShell({
  initialLayout,
  transactionCount,
  inventoryCount,
  inStockCount,
  plData,
  plLines,
  inventorySnapshot,
  expenseSummary,
  recentTransactions,
}: DashboardShellProps) {
  const router = useRouter();
  const [layout, setLayout] = useState(initialLayout);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setLayout(initialLayout);
    }
  }, [initialLayout, editing]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const plOrder = orderForPlSections(layout.order);

  async function saveLayout() {
    setBusy(true);
    setSaved(false);
    try {
      const prefs = layoutToPrefs(layout);
      const res = await fetch("/api/dashboard-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        setSaved(true);
        setEditing(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  function cancelEdit() {
    setLayout(initialLayout);
    setEditing(false);
    setSaved(false);
  }

  function renderSection(key: DashboardSectionKey) {
    if (!layout.visible[key]) return null;

    switch (key) {
      case "kpis":
        return (
          <div key="kpis" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Net cashflow"
              value={formatMoney(plData.netCashFlow)}
              hint="Sales − buys − expenses"
            />
            <StatCard
              label="In stock"
              value={String(inStockCount)}
              hint={`${inventoryCount} inventory rows`}
            />
            <StatCard label="Transactions" value={String(transactionCount)} />
            <StatCard
              label="Business expenses"
              value={formatMoney(plData.businessExpensesTotal)}
              hint={`${expenseSummary.count} record(s)`}
            />
          </div>
        );

      case "expenses":
        return (
          <section key="expenses" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <SectionHeading title="Business expenses" />
              <Link
                href="/business-expenses"
                className="text-sm text-brand underline hover:text-brand-hover"
              >
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
                      <span className="font-semibold tabular-nums text-brand">
                        {formatMoney(c.amount)}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        );

      case "recent":
        return (
          <section key="recent">
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
        );

      default:
        return null;
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading
          title="Dashboard"
          description={
            editing
              ? "Arrange sections below, then save"
              : "Buy/Sell focus, portfolio ROI, expenses, and recent activity"
          }
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (editing) {
                cancelEdit();
              } else {
                setEditing(true);
                setSaved(false);
              }
            }}
          >
            <LayoutGrid className="h-4 w-4" />
            {editing ? "Exit edit mode" : "Edit layout"}
          </Button>
          {!editing && (
            <>
              <Button asChild>
                <Link href="/quick-add">Quick add</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/inventory/new">Add card</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <DashboardLayoutEditor
          layout={layout}
          onChange={setLayout}
          onSave={saveLayout}
          onCancel={cancelEdit}
          busy={busy}
          saved={saved}
        />
      ) : (
        <div className="space-y-8">
          {layout.order.map((key) => {
            if (isPlSectionKey(key)) {
              if (!layout.visible[key]) return null;
              return (
                <MonthlyPlDashboard
                  key={key}
                  onlySection={key}
                  data={plData}
                  lines={plLines}
                  inventory={inventorySnapshot}
                  visible={layout.visible}
                  sectionOrder={plOrder}
                />
              );
            }
            return renderSection(key);
          })}
        </div>
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
