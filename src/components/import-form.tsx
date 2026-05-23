"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [replaceTransactions, setReplaceTransactions] = useState(true);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError(null);
    setResult(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    if (!selectedFile) {
      setError("Choose an .xlsx file first");
      setLoading(false);
      return;
    }

    const body = new FormData();
    body.append("file", selectedFile);
    body.append("replaceTransactions", replaceTransactions ? "true" : "false");

    const res = await fetch("/api/import", { method: "POST", body });
    setLoading(false);

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }

    setResult(
      `Imported ${data.inventoryImported} inventory rows, ${data.transactionsImported} transaction groups, ${data.transactionLinesTotal} total log rows` +
        (data.transactionsSkipped ? ` (${data.transactionsSkipped} groups skipped as duplicates).` : ".")
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4 rounded-lg border border-border bg-surface p-6">
      <p className="text-sm text-muted">
        Upload your <strong>Three Hats</strong> workbook (.xlsx). Reads{" "}
        <code className="text-xs">Cards Inventory</code> and{" "}
        <code className="text-xs">Transaction Log</code> sheets. Check{" "}
        <strong>Replace existing transaction log</strong> to reload all rows from Excel (recommended
        after a fix).
      </p>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={replaceTransactions}
          onChange={(e) => setReplaceTransactions(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-brand"
        />
        Replace existing transaction log before import
      </label>

      <div className="rounded-lg border border-dashed border-border bg-surface-elevated p-4">
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={onFileChange}
          className="sr-only"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose Excel file
          </Button>
          <p className="text-sm text-muted">
            {selectedFile ? (
              <>
                Selected:{" "}
                <span className="font-medium text-foreground">{selectedFile.name}</span>
              </>
            ) : (
              "No file chosen yet"
            )}
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {result ? <p className="text-sm text-success">{result}</p> : null}

      <Button type="submit" disabled={loading || !selectedFile}>
        {loading ? "Importing…" : "Import Excel"}
      </Button>
    </form>
  );
}
