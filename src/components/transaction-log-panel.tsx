"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  TransactionLogTable,
  type TransactionLogRow,
} from "@/components/transaction-log-table";
import type { TransactionLogPage } from "@/lib/transaction-log-types";

type Props = {
  initialPage: TransactionLogPage;
  months: string[];
};

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-SG", { month: "short", year: "numeric" });
}

export function TransactionLogPanel({ initialPage, months }: Props) {
  const [rows, setRows] = useState<TransactionLogRow[]>(initialPage.rows);
  const [total, setTotal] = useState(initialPage.total);
  const [hasMore, setHasMore] = useState(initialPage.hasMore);
  const [month, setMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (opts: { offset: number; month: string; append: boolean }) => {
    const params = new URLSearchParams({
      limit: String(initialPage.limit),
      offset: String(opts.offset),
    });
    if (opts.month) params.set("month", opts.month);

    const res = await fetch(`/api/transaction-log?${params}`);
    if (!res.ok) throw new Error("Failed to load transactions");
    const data = (await res.json()) as TransactionLogPage;

    setRows((prev) => (opts.append ? [...prev, ...data.rows] : data.rows));
    setTotal(data.total);
    setHasMore(data.hasMore);
  }, [initialPage.limit]);

  async function onMonthChange(value: string) {
    setMonth(value);
    setLoading(true);
    setError(null);
    try {
      await fetchPage({ offset: 0, month: value, append: false });
    } catch {
      setError("Could not load transactions for that month.");
    } finally {
      setLoading(false);
    }
  }

  async function onLoadMore() {
    setLoadingMore(true);
    setError(null);
    try {
      await fetchPage({ offset: rows.length, month, append: true });
    } catch {
      setError("Could not load more rows.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function onRefresh() {
    setError(null);
    try {
      await fetchPage({ offset: 0, month, append: false });
    } catch {
      setError("Could not refresh the log.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <label htmlFor="txn-month" className="text-xs font-medium uppercase text-muted-foreground">
            Month filter
          </label>
          <Select
            id="txn-month"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
            className="min-w-[180px]"
            disabled={loading}
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </Select>
        </div>
        <p className="text-sm text-muted">
          Loaded {rows.length} of {total} rows
          {month ? ` · ${monthLabel(month)}` : ""}
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <TransactionLogTable rows={rows} onMutated={onRefresh} />
      )}

      {hasMore && !loading ? (
        <div className="flex justify-center pt-2">
          <Button type="button" variant="outline" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : `Load more (${Math.min(initialPage.limit, total - rows.length)} rows)`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
