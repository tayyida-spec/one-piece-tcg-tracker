"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FilterableTable, type TableColumn } from "@/components/filterable-table";
import {
  displayItemType,
  displayTransactionType,
  formatExcelDate,
  formatExcelNumber,
  formatMoney,
} from "@/lib/utils";
import { TRANSACTION_ID_HINT } from "@/lib/transaction-codes";

export type TransactionLogRow = {
  id: string;
  itemType: string;
  cardName: string;
  cardId: string;
  series: string;
  rarity: string;
  quantity: number;
  unitPrice: number;
  smartpacFee: number | null;
  owner: string | null;
  reimbursement: string | null;
  platform: string | null;
  notes: string | null;
  transaction: {
    id: string;
    displayId: string;
    transactionType: string;
    date: string;
    smartpacFee: number | null;
  };
};

function lineTotal(row: TransactionLogRow) {
  const smartpac = row.smartpacFee ?? row.transaction.smartpacFee ?? 0;
  return row.quantity * row.unitPrice + smartpac;
}

export function TransactionLogTable({ rows }: { rows: TransactionLogRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<TransactionLogRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const columns: TableColumn<TransactionLogRow>[] = [
    {
      header: "Transaction ID",
      accessor: (r) => r.transaction.displayId,
      render: (r) => <span className="font-medium">{r.transaction.displayId}</span>,
    },
    {
      header: "Item Type",
      accessor: (r) => displayItemType(r.itemType),
      render: (r) => displayItemType(r.itemType),
    },
    {
      header: "Date",
      accessor: (r) => formatExcelDate(r.transaction.date),
      render: (r) => formatExcelDate(r.transaction.date),
    },
    {
      header: "Card/Item Name",
      accessor: (r) => r.cardName,
      render: (r) => (
        <span className="line-clamp-2 block max-w-[200px] break-words" title={r.cardName}>
          {r.cardName}
        </span>
      ),
      cellClassName: "min-w-[140px] max-w-[200px]",
    },
    {
      header: "Card/Item ID",
      accessor: (r) => r.cardId,
      render: (r) => r.cardId,
    },
    {
      header: "Series",
      accessor: (r) => r.series,
      render: (r) => r.series || "",
    },
    {
      header: "Rarity",
      accessor: (r) => r.rarity,
      render: (r) => r.rarity || "",
    },
    {
      header: "Transaction Type",
      accessor: (r) => displayTransactionType(r.transaction.transactionType),
      render: (r) => displayTransactionType(r.transaction.transactionType),
    },
    {
      header: "Quantity",
      accessor: (r) => formatExcelNumber(r.quantity),
      render: (r) => formatExcelNumber(r.quantity),
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
    {
      header: "Unit Price",
      accessor: (r) => formatExcelNumber(r.unitPrice),
      render: (r) => formatMoney(r.unitPrice),
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
    {
      header: "Total Amount",
      accessor: (r) => formatExcelNumber(lineTotal(r)),
      render: (r) => formatMoney(lineTotal(r)),
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
    {
      header: "Smartpac (SGD)",
      accessor: (r) => formatExcelNumber(r.smartpacFee ?? r.transaction.smartpacFee ?? 0),
      render: (r) => formatExcelNumber(r.smartpacFee ?? r.transaction.smartpacFee ?? 0),
      cellClassName: "text-right",
      headerClassName: "text-right",
    },
    {
      header: "Owner/Buyer/Seller",
      accessor: (r) => r.owner ?? "",
      render: (r) => r.owner || "",
    },
    {
      header: "Reimbursement",
      accessor: (r) => r.reimbursement ?? "",
      render: (r) =>
        r.reimbursement ? (
          <span className="line-clamp-2 block max-w-[160px] break-words" title={r.reimbursement}>
            {r.reimbursement}
          </span>
        ) : (
          ""
        ),
      cellClassName: "max-w-[160px]",
    },
    {
      header: "Platform",
      accessor: (r) => r.platform ?? "",
      render: (r) => r.platform || "",
    },
    {
      header: "Notes",
      accessor: (r) => r.notes ?? "",
      render: (r) =>
        r.notes ? (
          <span className="line-clamp-2 block max-w-[240px] break-words" title={r.notes}>
            {r.notes}
          </span>
        ) : (
          ""
        ),
      cellClassName: "min-w-[120px] max-w-[240px]",
    },
    {
      header: "",
      accessor: () => "",
      render: (r) => (
        <button
          type="button"
          className="text-sm text-brand underline hover:text-brand-hover"
          onClick={() => {
            setError(null);
            setEditing(r);
          }}
        >
          Edit
        </button>
      ),
      noFilter: true,
    },
  ];

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      displayId: fd.get("displayId"),
      itemType: fd.get("itemType"),
      date: fd.get("date"),
      cardName: fd.get("cardName"),
      cardId: fd.get("cardId"),
      series: fd.get("series"),
      rarity: fd.get("rarity"),
      transactionType: fd.get("transactionType"),
      quantity: fd.get("quantity"),
      unitPrice: fd.get("unitPrice"),
      smartpacFee: fd.get("smartpacFee") || null,
      owner: fd.get("owner") || null,
      reimbursement: fd.get("reimbursement") || null,
      platform: fd.get("platform") || null,
      notes: fd.get("notes") || null,
    };

    const res = await fetch(`/api/transaction-lines/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Save failed");
      return;
    }

    setEditing(null);
    router.refresh();
  }

  async function onDelete(row: TransactionLogRow) {
    if (!confirm(`Delete this row for ${row.cardName}?`)) return;
    const res = await fetch(`/api/transaction-lines/${row.id}`, { method: "DELETE" });
    if (res.ok) {
      setEditing(null);
      router.refresh();
    }
  }

  return (
    <>
      <FilterableTable
        columns={columns}
        rows={rows}
        preserveHeaderCase
        emptyMessage="No transactions yet."
      />

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-xl shadow-brand/10">
            <h3 className="text-lg font-semibold text-foreground">Edit transaction row</h3>
            <form onSubmit={onSave} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayId">Transaction ID</Label>
                  <Input
                    id="displayId"
                    name="displayId"
                    required
                    defaultValue={editing.transaction.displayId}
                  />
                  <p className="text-xs text-muted">{TRANSACTION_ID_HINT}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date (DD/MM/YYYY)</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    lang="en-GB"
                    required
                    defaultValue={editing.transaction.date.slice(0, 10)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="itemType">Item Type</Label>
                  <Select id="itemType" name="itemType" defaultValue={editing.itemType}>
                    <option value="card">Cards</option>
                    <option value="sealed">Case</option>
                    <option value="merchandise">Merchandise</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionType">Transaction Type</Label>
                  <Select
                    id="transactionType"
                    name="transactionType"
                    defaultValue={editing.transaction.transactionType}
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                    <option value="trade">Trade</option>
                    <option value="gift">Gift</option>
                    <option value="adjustment">Adjustment</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardName">Card/Item Name</Label>
                <Input id="cardName" name="cardName" required defaultValue={editing.cardName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardId">Card/Item ID</Label>
                <Input id="cardId" name="cardId" required defaultValue={editing.cardId} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="series">Series</Label>
                  <Input id="series" name="series" defaultValue={editing.series} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rarity">Rarity</Label>
                  <Input id="rarity" name="rarity" defaultValue={editing.rarity} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    defaultValue={editing.quantity}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price (SGD)</Label>
                  <Input
                    id="unitPrice"
                    name="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={editing.unitPrice}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smartpacFee">Smartpac (SGD)</Label>
                  <Input
                    id="smartpacFee"
                    name="smartpacFee"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={editing.smartpacFee ?? ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="owner">Owner/Buyer/Seller</Label>
                  <Input id="owner" name="owner" defaultValue={editing.owner ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reimbursement">Reimbursement</Label>
                  <Input
                    id="reimbursement"
                    name="reimbursement"
                    defaultValue={editing.reimbursement ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platform">Platform</Label>
                  <Input id="platform" name="platform" defaultValue={editing.platform ?? ""} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" defaultValue={editing.notes ?? ""} />
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving…" : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={() => onDelete(editing)}>
                  Delete row
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
