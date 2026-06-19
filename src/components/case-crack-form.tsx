"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardPaste, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TRANSACTION_ID_HINT } from "@/lib/transaction-codes";
import {
  emptyCrackRow,
  parseCaseCrackPaste,
  type CaseCrackPasteRow,
} from "@/lib/case-crack-paste";
import type { CrackableCase } from "@/lib/case-crack-types";

type CrackRow = CaseCrackPasteRow & { variant: string; notes: string; key: string };

function makeRow(partial?: Partial<CrackRow>): CrackRow {
  const base = emptyCrackRow();
  return {
    ...base,
    ...partial,
    key: partial?.key ?? crypto.randomUUID(),
  };
}

function rowsFromPaste(text: string): CrackRow[] {
  return parseCaseCrackPaste(text).map((r) =>
    makeRow({
      cardName: r.cardName,
      cardId: r.cardId,
      series: r.series,
      rarity: r.rarity,
      quantity: r.quantity,
      language: r.language,
      yytPrice: r.yytPrice,
    })
  );
}

export function CaseCrackForm({ cases }: { cases: CrackableCase[] }) {
  const router = useRouter();
  const [sealedItemId, setSealedItemId] = useState(cases[0]?.id ?? "");
  const [referenceTxn, setReferenceTxn] = useState(cases[0]?.suggestedTxn ?? "");
  const [sessionNotes, setSessionNotes] = useState("");
  const [rows, setRows] = useState<CrackRow[]>(() => [makeRow(), makeRow(), makeRow()]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedCase = useMemo(
    () => cases.find((c) => c.id === sealedItemId),
    [cases, sealedItemId]
  );

  const onCaseChange = useCallback(
    (id: string) => {
      setSealedItemId(id);
      const match = cases.find((c) => c.id === id);
      if (match?.suggestedTxn) setReferenceTxn(match.suggestedTxn);
    },
    [cases]
  );

  function updateRow(key: string, field: keyof CrackRow, value: string | number) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }

  function addRows(count: number) {
    setRows((prev) => [...prev, ...Array.from({ length: count }, () => makeRow())]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  }

  function applyPaste() {
    const parsed = rowsFromPaste(pasteText);
    if (parsed.length === 0) {
      setError("Could not parse any rows. Use: name, id, series, rarity, qty, lang (tab or comma).");
      return;
    }
    setRows((prev) => {
      const filled = prev.filter((r) => r.cardName.trim());
      return [...filled, ...parsed];
    });
    setPasteOpen(false);
    setPasteText("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);

    const lines = rows
      .filter((r) => r.cardName.trim())
      .map((r) => {
        const yytRaw = r.yytPrice.trim();
        const yytPriceSgd =
          yytRaw !== "" && Number.isFinite(Number(yytRaw)) && Number(yytRaw) > 0
            ? Number(yytRaw)
            : null;

        return {
          cardName: r.cardName.trim(),
          cardId: r.cardId.trim(),
          series: r.series.trim(),
          rarity: r.rarity.trim(),
          variant: r.variant.trim(),
          language: r.language.trim() || "JP",
          quantity: Number(r.quantity) || 1,
          notes: r.notes.trim() || null,
          yytPriceSgd,
        };
      });

    if (lines.length === 0) {
      setError("Add at least one card with a name.");
      setBusy(false);
      return;
    }

    try {
      const res = await fetch("/api/case-crack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sealedItemId,
          referenceTxn: referenceTxn.trim() || null,
          notes: sessionNotes.trim() || null,
          lines,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }

      setSuccess(
        `Logged ${data.totalUnits} card(s) from ${data.caseName}` +
          (data.referenceTxn ? ` (${data.referenceTxn})` : "") +
          (data.pricesUpdated > 0 ? ` — ${data.pricesUpdated} YYT price(s) saved` : "") +
          ". Case stock reduced by 1."
      );
      setRows([makeRow(), makeRow(), makeRow()]);
      setSessionNotes("");
      router.refresh();
    } catch {
      setError("Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (cases.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-muted">
        No sealed cases in stock. Add a case to Inventory first (item type Case / sealed), then
        return here to crack it.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sealedItemId">Case to open</Label>
          <Select
            id="sealedItemId"
            value={sealedItemId}
            onChange={(e) => onCaseChange(e.target.value)}
            required
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cardName} ({c.cardId}) — qty {c.quantity}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="referenceTxn">TXN reference (optional)</Label>
          <Input
            id="referenceTxn"
            value={referenceTxn}
            onChange={(e) => setReferenceTxn(e.target.value)}
            placeholder="TXN008"
          />
          <p className="text-xs text-muted">{TRANSACTION_ID_HINT}</p>
        </div>
      </div>

      {selectedCase ? (
        <p className="text-sm text-muted">
          Opening <span className="font-medium text-foreground">{selectedCase.cardName}</span> —
          pulls go to Inventory. Optional YYT price updates the Price list (SGD). Sell later via
          Quick add under the same TXN.
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="sessionNotes">Session notes (optional)</Label>
        <Input
          id="sessionNotes"
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="Trade night, who opened, etc."
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Pulled cards</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => addRows(1)}>
            <Plus className="mr-1 h-4 w-4" aria-hidden />
            Add row
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => addRows(10)}>
            Add 10 rows
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setPasteOpen((o) => !o)}>
            <ClipboardPaste className="mr-1 h-4 w-4" aria-hidden />
            Paste
          </Button>
        </div>
      </div>

      {pasteOpen ? (
        <div className="space-y-2 rounded-lg border border-border bg-surface-elevated p-4">
          <Label htmlFor="paste">Paste from spreadsheet</Label>
          <p className="text-xs text-muted">
            One card per line: name, id, series, rarity, qty, lang, yyt price — separated by tab
            or comma.
          </p>
          <Textarea
            id="paste"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={6}
            placeholder={"Luffy parallel\tOP17-001\tOP17\tSR\t1\tEN"}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={applyPaste}>
              Apply paste
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPasteOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-surface-elevated text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="min-w-[140px] px-2 py-2">Card name *</th>
              <th className="min-w-[100px] px-2 py-2">Card ID</th>
              <th className="px-2 py-2">Series</th>
              <th className="px-2 py-2">Rarity</th>
              <th className="px-2 py-2">Variant</th>
              <th className="w-16 px-2 py-2 text-right">Qty</th>
              <th className="w-16 px-2 py-2">Lang</th>
              <th className="min-w-[88px] px-2 py-2 text-right">YYT price</th>
              <th className="min-w-[100px] px-2 py-2">Notes</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-2 py-1">
                  <Input
                    value={row.cardName}
                    onChange={(e) => updateRow(row.key, "cardName", e.target.value)}
                    className="h-8 min-w-[120px]"
                    placeholder="Name"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    value={row.cardId}
                    onChange={(e) => updateRow(row.key, "cardId", e.target.value)}
                    className="h-8"
                    placeholder="OP17-…"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    value={row.series}
                    onChange={(e) => updateRow(row.key, "series", e.target.value)}
                    className="h-8 w-20"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    value={row.rarity}
                    onChange={(e) => updateRow(row.key, "rarity", e.target.value)}
                    className="h-8 w-16"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    value={row.variant}
                    onChange={(e) => updateRow(row.key, "variant", e.target.value)}
                    className="h-8 w-20"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={row.quantity}
                    onChange={(e) => updateRow(row.key, "quantity", Number(e.target.value) || 1)}
                    className="h-8 w-16 text-right"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    value={row.language}
                    onChange={(e) => updateRow(row.key, "language", e.target.value)}
                    className="h-8 w-14"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={row.yytPrice}
                    onChange={(e) => updateRow(row.key, "yytPrice", e.target.value)}
                    className="h-8 w-24 text-right"
                    placeholder="SGD"
                  />
                </td>
                <td className="px-2 py-1">
                  <Input
                    value={row.notes}
                    onChange={(e) => updateRow(row.key, "notes", e.target.value)}
                    className="h-8 min-w-[80px]"
                  />
                </td>
                <td className="px-2 py-1">
                  <button
                    type="button"
                    className="rounded p-1 text-muted hover:bg-surface-elevated hover:text-foreground"
                    onClick={() => removeRow(row.key)}
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-success">{success}</p> : null}

      <Button type="submit" disabled={busy}>
        {busy ? "Logging pulls…" : "Log all pulls to inventory"}
      </Button>
    </form>
  );
}
