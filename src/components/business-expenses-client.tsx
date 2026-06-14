"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "@/components/page-heading";
import { BUSINESS_EXPENSE_CATEGORIES } from "@/lib/validations";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { isoToDisplayDate, todayDisplayDate } from "@/lib/date-format";
import type { BusinessExpenseRow } from "@/lib/business-expense-data";
import { DateInput } from "@/components/date-input";

type FormState = {
  category: string;
  itemName: string;
  vendor: string;
  date: string;
  amount: string;
  paymentMethod: string;
  owner: string;
  reimbursement: string;
  recurring: boolean;
  frequency: string;
  expenseCode: string;
  notes: string;
};

function emptyForm(): FormState {
  return {
    category: BUSINESS_EXPENSE_CATEGORIES[0],
    itemName: "",
    vendor: "",
    date: todayDisplayDate(),
    amount: "",
    paymentMethod: "",
    owner: "",
    reimbursement: "",
    recurring: false,
    frequency: "",
    expenseCode: "",
    notes: "",
  };
}

function rowToForm(row: BusinessExpenseRow): FormState {
  return {
    category: row.category,
    itemName: row.itemName,
    vendor: row.vendor ?? "",
    date: isoToDisplayDate(row.date.slice(0, 10)),
    amount: String(row.amount),
    paymentMethod: row.paymentMethod ?? "",
    owner: row.owner ?? "",
    reimbursement: row.reimbursement ?? "",
    recurring: row.recurring,
    frequency: row.frequency ?? "",
    expenseCode: row.expenseCode ?? "",
    notes: row.notes ?? "",
  };
}

export function BusinessExpensesClient({ rows }: { rows: BusinessExpenseRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.category, (map.get(r.category) ?? 0) + r.amount);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  function startAdd() {
    setForm(emptyForm());
    setAdding(true);
    setEditingId(null);
    setError(null);
  }

  function startEdit(row: BusinessExpenseRow) {
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
      category: form.category,
      itemName: form.itemName,
      vendor: form.vendor || null,
      date: form.date,
      amount: form.amount,
      paymentMethod: form.paymentMethod || null,
      owner: form.owner || null,
      reimbursement: form.reimbursement || null,
      recurring: form.recurring,
      frequency: form.frequency || null,
      expenseCode: form.expenseCode || null,
      notes: form.notes || null,
    };

    const url = editingId ? `/api/business-expenses/${editingId}` : "/api/business-expenses";
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Save failed. Check the fields and try again.");
      }
      cancel();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this expense?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/business-expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      if (editingId === id) cancel();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  const formOpen = adding || editingId !== null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-brand/40 bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total expenses</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{formatMoney(total)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{rows.length} record(s)</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">By category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {byCategory.length === 0 ? (
              <span className="text-sm text-muted">No expenses yet.</span>
            ) : (
              byCategory.map(([cat, amt]) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs text-foreground"
                >
                  {cat}
                  <span className="font-semibold tabular-nums text-brand">{formatMoney(amt)}</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <SectionHeading title="All expenses" />
        {!formOpen && (
          <Button onClick={startAdd} size="sm">
            <Plus className="h-4 w-4" /> Add expense
          </Button>
        )}
      </div>

      {formOpen && (
        <div className="rounded-lg border border-brand/40 bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-foreground">
              {editingId ? "Edit expense" : "New expense"}
            </h3>
            <button onClick={cancel} className="text-muted hover:text-foreground" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {BUSINESS_EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Item / service">
              <Input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} placeholder="e.g. Card Sleeves" />
            </Field>
            <Field label="Amount (SGD)">
              <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </Field>
            <Field label="Date">
              <DateInput
                id="exp-date"
                value={form.date}
                onChange={(date) => setForm({ ...form, date })}
              />
            </Field>
            <Field label="Vendor / platform">
              <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Shopee" />
            </Field>
            <Field label="Paid by (owner)">
              <Input value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="e.g. Yi Da" />
            </Field>
            <Field label="Payment method">
              <Input value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} placeholder="e.g. PayNow" />
            </Field>
            <Field label="Reimbursement">
              <Select value={form.reimbursement} onChange={(e) => setForm({ ...form, reimbursement: e.target.value })}>
                <option value="">—</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </Select>
            </Field>
            <Field label="Expense code (optional)">
              <Input value={form.expenseCode} onChange={(e) => setForm({ ...form, expenseCode: e.target.value })} placeholder="e.g. EXP007" />
            </Field>
            <Field label="Recurring">
              <label className="flex h-10 items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} className="h-4 w-4" />
                Recurring expense
              </label>
            </Field>
            {form.recurring && (
              <Field label="Frequency">
                <Input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="e.g. Monthly" />
              </Field>
            )}
            <Field label="Notes" className="sm:col-span-2 lg:col-span-3">
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes" />
            </Field>
          </div>

          {error && <p className="mt-3 text-sm text-danger">{error}</p>}

          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={busy || !form.itemName.trim()}>
              {busy ? "Saving…" : editingId ? "Save changes" : "Add expense"}
            </Button>
            <Button variant="outline" onClick={cancel} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-surface-elevated text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Item / service</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Paid by</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                  No business expenses yet. Add one above.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className={cn(editingId === r.id && "bg-surface-elevated")}>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(r.date)}</td>
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {r.itemName}
                    {r.notes && <span className="block text-xs text-muted-foreground">{r.notes}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{r.vendor ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{r.owner ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(r.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(r)} className="rounded p-1.5 text-muted hover:bg-surface hover:text-brand" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(r.id)} disabled={busy} className="rounded p-1.5 text-muted hover:bg-surface hover:text-danger" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}
