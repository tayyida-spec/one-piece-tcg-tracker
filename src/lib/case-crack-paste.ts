export type CaseCrackPasteRow = {
  cardName: string;
  cardId: string;
  series: string;
  rarity: string;
  quantity: number;
  language: string;
  marketPrice: string;
};

/** Parse clipboard text (tab or comma separated) into crack rows. */
export function parseCaseCrackPaste(text: string): CaseCrackPasteRow[] {
  const rows: CaseCrackPasteRow[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const parts = line.includes("\t")
      ? line.split("\t").map((p) => p.trim())
      : line.split(",").map((p) => p.trim());

    const cardName = parts[0] ?? "";
    if (!cardName) continue;

    const qtyRaw = parts[4] ?? "1";
    const qty = Number(qtyRaw);
    const quantity = Number.isFinite(qty) && qty > 0 ? qty : 1;

    rows.push({
      cardName,
      cardId: parts[1] ?? "",
      series: parts[2] ?? "",
      rarity: parts[3] ?? "",
      quantity,
      language: (parts[5] ?? "JP").toUpperCase() || "JP",
      marketPrice: parts[6] ?? "",
    });
  }

  return rows;
}

export function emptyCrackRow(): CaseCrackPasteRow & { variant: string; notes: string } {
  return {
    cardName: "",
    cardId: "",
    series: "",
    rarity: "",
    variant: "",
    language: "JP",
    quantity: 1,
    notes: "",
    marketPrice: "",
  };
}
