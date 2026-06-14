"use client";

import Link from "next/link";
import { FilterableTable, type TableColumn } from "@/components/filterable-table";
import { displayInventoryStatus, formatMoney } from "@/lib/utils";

function displayInventoryType(itemType: string) {
  const t = itemType.toLowerCase();
  if (t === "sealed" || t === "case") return "Sealed";
  if (t === "merchandise") return "Merchandise";
  return "Cards";
}

export type InventoryRow = {
  id: string;
  itemType: string;
  cardName: string;
  cardId: string;
  series: string;
  rarity: string;
  language: string;
  variant: string;
  condition: string | null;
  quantity: number;
  location: string | null;
  purchasePrice: number;
  currentMarketPrice: number;
  owner: string | null;
  status: string;
  notes: string | null;
};

function statusClassName(status: string) {
  if (status === "in_stock") {
    return "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-success";
  }
  if (status === "cracked") {
    return "rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800";
  }
  return "rounded-full bg-brand-dim px-2 py-0.5 text-xs text-brand";
}

const columns: TableColumn<InventoryRow>[] = [
  {
    header: "Type",
    accessor: (r) => displayInventoryType(r.itemType),
    render: (r) => displayInventoryType(r.itemType),
  },
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
    header: "Condition",
    accessor: (r) => r.condition ?? "",
    render: (r) => r.condition || "—",
  },
  {
    header: "Qty",
    accessor: (r) => String(r.quantity),
    render: (r) => r.quantity,
    cellClassName: "text-right",
    headerClassName: "text-right",
  },
  {
    header: "Location",
    accessor: (r) => r.location ?? "",
    render: (r) => r.location || "—",
  },
  {
    header: "Current market price (SGD)",
    accessor: (r) => formatMoney(r.currentMarketPrice),
    render: (r) => formatMoney(r.currentMarketPrice),
    cellClassName: "text-right whitespace-nowrap",
    headerClassName: "text-right",
  },
  {
    header: "Cost (SGD)",
    accessor: (r) => formatMoney(r.purchasePrice),
    render: (r) => formatMoney(r.purchasePrice),
    cellClassName: "text-right whitespace-nowrap",
    headerClassName: "text-right",
  },
  {
    header: "Owner",
    accessor: (r) => r.owner ?? "",
    render: (r) => r.owner || "—",
  },
  {
    header: "Status",
    accessor: (r) => displayInventoryStatus(r.status),
    render: (r) => (
      <span className={statusClassName(r.status)}>{displayInventoryStatus(r.status)}</span>
    ),
  },
  {
    header: "Notes",
    accessor: (r) => r.notes ?? "",
    render: (r) => r.notes || "—",
    cellClassName: "min-w-[120px] max-w-[240px]",
  },
  {
    header: "",
    accessor: () => "",
    render: (r) => (
      <Link href={`/inventory/${r.id}`} className="text-sm text-brand underline hover:text-brand-hover">
        Edit
      </Link>
    ),
    noFilter: true,
  },
];

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  return (
    <FilterableTable
      columns={columns}
      rows={rows}
      preserveHeaderCase
      emptyMessage="No inventory items yet."
    />
  );
}
