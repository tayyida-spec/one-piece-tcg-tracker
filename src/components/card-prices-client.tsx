"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CardPriceRow } from "@/lib/card-price-data";
import { CardPriceTable } from "@/components/card-price-table";

type ImportResult = {
  imported: number;
  rate: number;
  source: string;
};

export function CardPricesClient({
  rows,
  jpyToSgdRate,
}: {
  rows: CardPriceRow[];
  jpyToSgdRate: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function importFromYyt() {
    const ok = window.confirm(
      `Import OP16 retail prices from YuYu-Tei?\n\n` +
        `This overwrites price list rows using JPY × ${jpyToSgdRate} → SGD.\n` +
        `Inventory is not affected.`
    );
    if (!ok) return;

    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/card-prices/import-yyt-op16", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult(data as ImportResult);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-elevated p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Import from YuYu-Tei (OP16)</p>
          <p className="text-sm text-muted">
            Reference price list from{" "}
            <a
              href="https://yuyu-tei.jp/sell/opc/s/op16"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              yuyu-tei.jp/sell/opc/s/op16
            </a>
            . Rate: <span className="font-medium text-foreground">1 JPY = {jpyToSgdRate} SGD</span>{" "}
            (<code className="text-xs">YYT_JPY_TO_SGD</code>).
          </p>
        </div>
        <Button type="button" onClick={importFromYyt} disabled={busy}>
          <Download className="mr-2 h-4 w-4" aria-hidden />
          {busy ? "Importing…" : "Import OP16 prices"}
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {result ? (
        <p className="rounded-md border border-success/30 bg-emerald-50 px-3 py-2 text-sm text-success">
          Imported {result.imported} cards at rate {result.rate}.
        </p>
      ) : null}

      <CardPriceTable rows={rows} />
    </div>
  );
}
