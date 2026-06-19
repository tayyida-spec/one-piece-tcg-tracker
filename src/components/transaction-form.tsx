"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/date-input";
import { todayDisplayDate } from "@/lib/date-format";
import { TRANSACTION_ID_HINT } from "@/lib/transaction-codes";

async function autofillDisplayIdPrefix(value: string): Promise<string | null> {
  const upper = value.trim().toUpperCase();
  if (upper !== "TXN" && upper !== "BC") return null;
  const prefix = upper === "TXN" ? "txn" : "bc";
  const res = await fetch(`/api/transactions/next-code?prefix=${prefix}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { code?: string };
  return data.code ?? null;
}

export function TransactionForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [displayId, setDisplayId] = useState("");

  const today = todayDisplayDate();

  async function onDisplayIdBlur() {
    const next = await autofillDisplayIdPrefix(displayId);
    if (next) setDisplayId(next);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const displayIdValue = (fd.get("displayId") as string)?.trim();
    const str = (name: string) => (fd.get(name) as string | null)?.trim() ?? "";

    const body = {
      ...(compact ? { quickAdd: true } : {}),
      transactionType: fd.get("transactionType"),
      date: fd.get("date"),
      ...(displayIdValue ? { displayId: displayIdValue } : {}),
      batchLabel: fd.get("batchLabel") || null,
      smartpacFee: fd.get("smartpacFee") || null,
      notes: fd.get("notes") || null,
      lines: [
        {
          itemType: fd.get("itemType"),
          cardName: str("cardName"),
          cardId: str("cardId"),
          series: str("series"),
          rarity: str("rarity"),
          language: fd.get("language"),
          variant: str("variant"),
          quantity: fd.get("quantity"),
          unitPrice: fd.get("unitPrice"),
          owner: str("owner") || null,
          notes: compact ? str("lineNotes") || null : null,
        },
      ],
    };

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ? JSON.stringify(data.error) : "Save failed");
      return;
    }

    const txn = await res.json();
    router.push(compact ? "/transactions" : `/transactions/${txn.id}`);
    router.refresh();
  }

  const displayIdField = (
    <div className="space-y-2">
      <Label htmlFor="displayId">Transaction ID (optional)</Label>
      <Input
        id="displayId"
        name="displayId"
        value={displayId}
        onChange={(e) => setDisplayId(e.target.value)}
        onBlur={onDisplayIdBlur}
        placeholder={
          compact
            ? "TXN or BC for next · reuse BC008 for sells"
            : "Type TXN or BC for next code, or BC008 to reuse"
        }
      />
      {!compact ? <p className="text-xs text-muted">{TRANSACTION_ID_HINT}</p> : null}
    </div>
  );

  return (
    <form
      onSubmit={onSubmit}
      className={`space-y-4 rounded-lg border border-border bg-surface p-6 ${compact ? "max-w-lg" : "max-w-xl"}`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="transactionType">Type</Label>
          <Select id="transactionType" name="transactionType" defaultValue="buy" required>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="trade">Trade</option>
            <option value="gift">Gift</option>
            <option value="adjustment">Adjustment</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <DateInput id="date" name="date" defaultValue={today} required />
        </div>
      </div>

      {!compact ? (
        <>
          {displayIdField}
          <div className="space-y-2">
            <Label htmlFor="batchLabel">Batch label (optional)</Label>
            <Input id="batchLabel" name="batchLabel" placeholder="Trade night, OP15 case…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smartpacFee">Smartpac / shipping (SGD)</Label>
            <Input id="smartpacFee" name="smartpacFee" type="number" step="0.01" min="0" />
          </div>
        </>
      ) : (
        displayIdField
      )}

      <hr className="border-border" />
      <p className="text-sm font-medium text-foreground">Line item</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="itemType">Item type</Label>
          <Select id="itemType" name="itemType" defaultValue="card">
            <option value="card">Card</option>
            <option value="sealed">Sealed / case</option>
            <option value="merchandise">Merchandise</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select id="language" name="language" defaultValue="JP">
            <option value="JP">JP</option>
            <option value="EN">EN</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardName">Name</Label>
        <Input id="cardName" name="cardName" required placeholder="Luffy Snakeman Manga" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cardId">Card ID</Label>
        <Input id="cardId" name="cardId" required={!compact} placeholder="OP11-118" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="series">Series</Label>
          <Input id="series" name="series" placeholder="OP11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rarity">Rarity</Label>
          <Input id="rarity" name="rarity" placeholder="SEC*/AA" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="variant">Variant</Label>
        <Input id="variant" name="variant" placeholder="manga, AA…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="quantity">Qty</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit price (SGD)</Label>
          <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min="0" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner">Owner</Label>
          <Input id="owner" name="owner" />
        </div>
      </div>

      {!compact ? (
        <div className="space-y-2">
          <Label htmlFor="notes">Transaction notes</Label>
          <Textarea id="notes" name="notes" />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="lineNotes">Notes</Label>
          <Input id="lineNotes" name="lineNotes" />
        </div>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Saving…" : "Save transaction"}
      </Button>
    </form>
  );
}
