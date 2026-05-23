"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useColumnFilters } from "@/hooks/use-column-filters";

export type TableColumn<T> = {
  header: string;
  accessor: (row: T) => string;
  render: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  filterPlaceholder?: string;
  /** Actions column — no filter input */
  noFilter?: boolean;
};

export function FilterableTable<T extends { id: string }>({
  columns,
  rows,
  preserveHeaderCase = false,
  emptyMessage = "No rows.",
}: {
  columns: TableColumn<T>[];
  rows: T[];
  preserveHeaderCase?: boolean;
  emptyMessage?: string;
}) {
  const filterAccessors = columns.map((col) =>
    col.noFilter ? () => "" : col.accessor
  );

  const { filters, setFilter, clearFilters, filteredRows, hasActiveFilters } =
    useColumnFilters(rows, filterAccessors);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">
          Showing {filteredRows.length} of {rows.length} rows
        </p>
        {hasActiveFilters ? (
          <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="table-header-accent min-w-full text-left text-sm">
          <thead className="bg-surface-elevated text-muted">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={`header-${i}-${col.header}`}
                  className={cn(
                    "whitespace-nowrap px-3 py-2 text-xs font-medium",
                    !preserveHeaderCase && "uppercase text-muted-foreground",
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface">
              {columns.map((col, i) => (
                <th key={`filter-${i}-${col.header}`} className="px-2 py-1.5 font-normal">
                  {col.noFilter ? null : (
                    <Input
                      value={filters[i]}
                      onChange={(e) => setFilter(i, e.target.value)}
                      placeholder={col.filterPlaceholder ?? "Filter…"}
                      className="h-8 min-w-[72px] text-xs"
                      aria-label={`Filter ${col.header}`}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-muted"
                >
                  {rows.length === 0 ? emptyMessage : "No rows match your filters."}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-elevated/50">
                  {columns.map((col, i) => (
                    <td
                      key={`${row.id}-${i}-${col.header}`}
                      className={cn("px-3 py-2 align-top text-foreground", col.cellClassName)}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
