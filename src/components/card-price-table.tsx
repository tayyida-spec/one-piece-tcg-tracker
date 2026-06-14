"use client";

import { FilterableTable, type TableColumn } from "@/components/filterable-table";
import { formatDate, formatMoney } from "@/lib/utils";
import type { CardPriceRow } from "@/lib/card-price-data";

const columns: TableColumn<CardPriceRow>[] = [
  {
    header: "Card",
    accessor: (r) => r.cardName,
    render: (r) => <span className="font-medium">{r.cardName}</span>,
    cellClassName: "min-w-[140px]",
  },
  {
    header: "ID",
    accessor: (r) => r.cardId,
    render: (r) => r.cardId,
  },
  {
    header: "Series",
    accessor: (r) => r.series,
    render: (r) => r.series || "—",
  },
  {
    header: "Rarity",
    accessor: (r) => r.rarity,
    render: (r) => r.rarity || "—",
  },
  {
    header: "Lang",
    accessor: (r) => r.language,
    render: (r) => r.language,
  },
  {
    header: "Variant",
    accessor: (r) => r.variant,
    render: (r) => r.variant || "—",
  },
  {
    header: "Price (SGD)",
    accessor: (r) => (r.marketPriceSgd != null ? formatMoney(r.marketPriceSgd) : ""),
    render: (r) =>
      r.marketPriceSgd != null ? (
        <span className="font-semibold text-brand">{formatMoney(r.marketPriceSgd)}</span>
      ) : (
        <span className="text-muted">—</span>
      ),
    cellClassName: "text-right whitespace-nowrap",
    headerClassName: "text-right",
  },
  {
    header: "Updated",
    accessor: (r) => (r.priceUpdatedAt ? formatDate(r.priceUpdatedAt) : ""),
    render: (r) => (r.priceUpdatedAt ? formatDate(r.priceUpdatedAt) : "—"),
    cellClassName: "whitespace-nowrap text-muted",
  },
];

export function CardPriceTable({ rows }: { rows: CardPriceRow[] }) {
  const priced = rows.filter((r) => r.marketPriceSgd != null).length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {priced} of {rows.length} cards with an SGD price. Reference only — not linked to
        inventory.
      </p>
      <FilterableTable
        columns={columns}
        rows={rows}
        preserveHeaderCase
        emptyMessage="No cards on the price list yet. Use Import OP16 prices to populate this page."
      />
    </div>
  );
}
