import { useState } from "react";
import { matchesColumnFilter } from "@/lib/column-filter";

export function useColumnFilters<T>(
  rows: T[],
  accessors: ((row: T) => string)[]
): {
  filters: string[];
  setFilter: (index: number, value: string) => void;
  clearFilters: () => void;
  filteredRows: T[];
  hasActiveFilters: boolean;
} {
  const [filters, setFilters] = useState<string[]>(() => accessors.map(() => ""));

  const filteredRows = rows.filter((row) =>
    accessors.every((accessor, i) => matchesColumnFilter(accessor(row), filters[i] ?? ""))
  );

  const hasActiveFilters = filters.some((f) => f.trim().length > 0);

  function setFilter(index: number, value: string) {
    setFilters((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function clearFilters() {
    setFilters(accessors.map(() => ""));
  }

  return { filters, setFilter, clearFilters, filteredRows, hasActiveFilters };
}
