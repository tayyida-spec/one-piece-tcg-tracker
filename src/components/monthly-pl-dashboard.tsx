"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  breakdownByBatchCategory,
  breakdownByDisplayId,
  type BatchCategoryPlRow,
  type DisplayIdPlRow,
  type MonthlyPlRow,
  type PlDashboardData,
  type PlLineInput,
} from "@/lib/pl-dashboard";
import { formatDisplayIdLabel } from "@/lib/pl-dashboard";
import { BatchBadge } from "@/components/batch-badge";
import { SectionHeading } from "@/components/page-heading";
import { cn, formatMoney } from "@/lib/utils";
import type { TransactionBatchCategory } from "@/lib/transaction-codes";
import { Select } from "@/components/ui/select";

type Props = {
  data: PlDashboardData;
  lines: PlLineInput[];
};

function PlValue({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const positive = value > 0;
  const negative = value < 0;
  return (
    <span
      className={cn(
        negative && "text-danger",
        positive && "text-success",
        !positive && !negative && "text-foreground",
        className
      )}
    >
      {formatMoney(value)}
    </span>
  );
}

export function MonthlyPlDashboard({ data, lines }: Props) {
  const defaultMonth = data.months[0]?.month ?? "";
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [scope, setScope] = useState<"all" | "month">("all");

  const selected = useMemo(
    () => data.months.find((m) => m.month === selectedMonth),
    [data.months, selectedMonth]
  );

  const monthFilter = scope === "month" && selectedMonth ? selectedMonth : undefined;

  const batchCategories = useMemo(
    () => breakdownByBatchCategory(lines, monthFilter),
    [lines, monthFilter]
  );

  const byDisplayId = useMemo(
    () => breakdownByDisplayId(lines, monthFilter),
    [lines, monthFilter]
  );

  const txnRows = useMemo(() => byDisplayId.filter((r) => r.category === "txn"), [byDisplayId]);
  const bcRows = useMemo(() => byDisplayId.filter((r) => r.category === "bc"), [byDisplayId]);

  const allTime = useMemo(() => {
    const batches = breakdownByBatchCategory(lines);
    return batches.reduce(
      (acc, b) => ({
        buyTotal: acc.buyTotal + b.buyTotal,
        sellTotal: acc.sellTotal + b.sellTotal,
        realizedPl: acc.realizedPl + b.realizedPl,
      }),
      { buyTotal: 0, sellTotal: 0, realizedPl: 0 }
    );
  }, [lines]);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-3">
          <SectionHeading title="Portfolio snapshot" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotCard
            label="Est. market value"
            value={formatMoney(data.totalMarketValue)}
            hint={`${data.inStockCount} in-stock rows`}
          />
          <SnapshotCard
            label="Cost basis (inventory)"
            value={formatMoney(data.totalCostBasis)}
            hint="Purchase price × qty on in-stock"
          />
          <SnapshotCard
            label="Unrealized P/L"
            value={<PlValue value={data.unrealizedPl} />}
            hint="Market − cost on in-stock"
          />
          <SnapshotCard
            label="All-time realized P/L"
            value={<PlValue value={allTime.realizedPl} />}
            hint="TXN case breaks + BC buy/sell batches"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionHeading
              title="P/L by batch (TXN & BC)"
              description="TXN = case break · BC = buy and sell cards (same BC### for a pair, e.g. BC006)."
            />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px]">
              <label htmlFor="scope-select" className="mb-1 block text-xs font-medium text-muted">
                Period
              </label>
              <Select
                id="scope-select"
                value={scope}
                onChange={(e) => setScope(e.target.value as "all" | "month")}
              >
                <option value="all">All time</option>
                <option value="month">Selected month</option>
              </Select>
            </div>
            {scope === "month" && data.months.length > 0 && (
              <div className="min-w-[180px]">
                <label htmlFor="month-select" className="mb-1 block text-xs font-medium text-muted">
                  Month
                </label>
                <Select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {data.months.map((m) => (
                    <option key={m.month} value={m.month}>
                      {m.label}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </div>

        {batchCategories.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface-elevated px-4 py-8 text-center text-sm text-muted">
            No TXN or BC transactions yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {batchCategories.map((b) => (
              <BatchCategoryCard key={b.category} row={b} />
            ))}
          </div>
        )}

        {(txnRows.length > 0 || bcRows.length > 0) && (
          <div className="space-y-4">
            {txnRows.length > 0 && (
              <DisplayIdTable
                category="txn"
                title="TXN — case breaks"
                hint="P/L = card sales − case cost (unsold pulls not deducted)"
                rows={txnRows}
              />
            )}
            {bcRows.length > 0 && (
              <DisplayIdTable
                category="bc"
                title="BC — buy / sell cards"
                hint="P/L = sales − purchases for that BC### (buy and sell rows share the same ID)"
                rows={bcRows}
              />
            )}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <SectionHeading
            title="Monthly P/L"
            description="By transaction date · fees not included here"
          />
        </div>

        {data.months.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface-elevated px-4 py-8 text-center text-sm text-muted">
            No transactions yet.
          </p>
        ) : (
          <>
            {selected && <MonthSummaryCards row={selected} />}

            <div className="overflow-x-auto rounded-lg border border-border bg-surface">
              <table className="table-header-accent min-w-full text-sm">
                <thead>
                  <tr className="bg-surface-elevated text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3">Month</th>
                    <th className="px-4 py-3 text-right">Purchases</th>
                    <th className="px-4 py-3 text-right">Sales</th>
                    <th className="px-4 py-3 text-right">Realized P/L</th>
                    <th className="px-4 py-3 text-right">Net cash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.months.map((m) => (
                    <tr
                      key={m.month}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-surface-elevated",
                        m.month === selectedMonth && "bg-surface-elevated"
                      )}
                      onClick={() => setSelectedMonth(m.month)}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{m.label}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(m.buyTotal)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(m.sellTotal)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <PlValue value={m.realizedPl} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <PlValue value={m.netCashFlow} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const cardAccent: Record<TransactionBatchCategory, string> = {
  txn: "border-tan/50 ring-1 ring-tan/20",
  bc: "border-brand/50 ring-1 ring-brand/20",
  other: "border-border",
};

function BatchCategoryCard({ row }: { row: BatchCategoryPlRow }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-surface p-4",
        cardAccent[row.category]
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <BatchBadge category={row.category}>
          {row.category === "txn" ? "TXN" : row.category === "bc" ? "BC" : "Other"}
        </BatchBadge>
        <p className="font-medium text-foreground">{row.label}</p>
      </div>
      <p className="mt-1 text-xs text-muted">{row.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted">Purchases</p>
          <p className="font-semibold tabular-nums">{formatMoney(row.buyTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Sales</p>
          <p className="font-semibold tabular-nums">{formatMoney(row.sellTotal)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-muted">Realized P/L</p>
          <p className="font-semibold tabular-nums">
            <PlValue value={row.realizedPl} />
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {row.lineCount} lines · Net cash <PlValue value={row.netCashFlow} className="text-xs" />
      </p>
    </div>
  );
}

function DisplayIdTable({
  category,
  title,
  hint,
  rows,
}: {
  category: TransactionBatchCategory;
  title: string;
  hint: string;
  rows: DisplayIdPlRow[];
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-surface",
        category === "txn" ? "border-tan/40" : category === "bc" ? "border-brand/40" : "border-border"
      )}
    >
      <div className="border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <BatchBadge category={category}>
            {category === "txn" ? "TXN" : category === "bc" ? "BC" : "Other"}
          </BatchBadge>
          <h4 className="font-display text-sm font-semibold text-foreground">{title}</h4>
        </div>
        <p className="mt-1 text-xs text-muted">{hint}</p>
      </div>
      <table className="table-header-accent min-w-full text-sm">
        <thead>
          <tr className="bg-surface-elevated text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-2">Transaction ID</th>
            <th className="px-4 py-2 text-right">Purchases</th>
            <th className="px-4 py-2 text-right">Sales</th>
            <th className="px-4 py-2 text-right">P/L</th>
            <th className="px-4 py-2 text-right">Net cash</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.displayId}>
              <td className="px-4 py-2 font-medium text-foreground">
                {formatDisplayIdLabel(r.displayId, r.subtitle)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums">{formatMoney(r.buyTotal)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatMoney(r.sellTotal)}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                <PlValue value={r.realizedPl} />
              </td>
              <td className="px-4 py-2 text-right tabular-nums">
                <PlValue value={r.netCashFlow} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MonthSummaryCards({ row }: { row: MonthlyPlRow }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SnapshotCard label="Purchases" value={formatMoney(row.buyTotal)} hint={`${row.buyCount} lines`} />
      <SnapshotCard label="Sales" value={formatMoney(row.sellTotal)} hint={`${row.sellCount} lines`} />
      <SnapshotCard label="Realized P/L" value={<PlValue value={row.realizedPl} />} />
      <SnapshotCard label="Net cash" value={<PlValue value={row.netCashFlow} />} />
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
