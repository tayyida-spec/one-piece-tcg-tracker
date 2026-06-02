"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "@/components/page-heading";
import { formatDate, formatMoney } from "@/lib/utils";
import type { CapitalContributionRow } from "@/lib/capital-types";
import { getEnvCapitalFallback } from "@/lib/capital-constants";

type FormState = {
  date: string;
  amount: string;
  contributor: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    contributor: "",
    notes: "",
  };
}

function rowToForm(row: CapitalContributionRow): FormState {
  return {
    date: row.date.slice(0, 10),
    amount: String(row.amount),
    contributor: row.contributor ?? "",
    notes: row.notes ?? "",
  };
}

export function CapitalClient({
  rows,
  totalCapital,
  isAdmin,
  usingEnvFallback,
}: {
  rows: CapitalContributionRow[];
  totalCapital: number;
  isAdmin: boolean;
  usingEnvFallback: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startAdd() {
    setForm(emptyForm());
    setAdding(true);
    setEditingId(null);
    setError(null);
  }

  function startEdit(row: CapitalContributionRow) {
    setForm(rowToForm(row));
    setEditingId(row.id);
    setAdding(false);
    setError(null);
  }

  function cancel() {
    setAdding(false);
    setEditingId(null);
    setError(null);
  }

  async function save() {
    setBusy(true);
    setError(null);
    const payload = {
      date: form.date,
      amount: form.amount,
      contributor: form.contributor || null,
      notes: form.notes || null,
    };
    const url = editingId ? `/api/capital/${editingId}` : "/api/capital";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      cancel();
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this capital entry?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/capital/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Delete failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const showForm = adding || editingId;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4 max-w-sm">
        <p className="text-xs font-medium uppercase text-muted-foreground">Total pumped in</p>
        <p className="mt-1 font-display text-2xl font-semibold text-foreground">
          {formatMoney(totalCapital)}
        </p>
        <p className="mt-1 text-xs text-muted">
          Used for Remaining capital on the dashboard
          {usingEnvFallback
            ? ` · env fallback ${formatMoney(getEnvCapitalFallback())} until contributions are logged`
            : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading title="Capital contributions" />
        <Button type="button" size="sm" onClick={startAdd}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Add contribution
        </Button>
      </div>

      {showForm ? (
        <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
          <h3 className="font-medium text-foreground">
            {editingId ? "Edit contribution" : "New contribution"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="cap-date">
                Date
              </label>
              <Input
                id="cap-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="cap-amount">
                Amount (SGD)
              </label>
              <Input
                id="cap-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="cap-contributor">
                Contributor
              </label>
              <Input
                id="cap-contributor"
                placeholder="Who pumped in the cash"
                value={form.contributor}
                onChange={(e) => setForm((f) => ({ ...f, contributor: e.target.value }))}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="cap-notes">
                Notes
              </label>
              <Textarea
                id="cap-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="button" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {!showForm && error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="table-header-accent min-w-full text-sm">
          <thead>
            <tr className="bg-surface-elevated text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2 text-right">Amount</th>
              <th className="px-4 py-2">Contributor</th>
              <th className="px-4 py-2">Notes</th>
              {isAdmin ? <th className="px-4 py-2" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-muted">
                  No contributions logged yet.
                  {usingEnvFallback
                    ? ` Dashboard uses ${formatMoney(getEnvCapitalFallback())} from env until you add one.`
                    : ""}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-2">{formatDate(row.date)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatMoney(row.amount)}</td>
                  <td className="px-4 py-2">{row.contributor || "—"}</td>
                  <td className="px-4 py-2 max-w-[240px] truncate" title={row.notes ?? undefined}>
                    {row.notes || "—"}
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(row)}>
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(row.id)}
                          disabled={busy}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
