export function buildTransactionImportKey(
  displayId: string,
  date: Date | string,
  transactionType: string
) {
  const d = new Date(date);
  const datePart = Number.isNaN(d.getTime()) ? "unknown" : d.toISOString().slice(0, 10);
  return `${displayId.trim()}|${datePart}|${transactionType.trim().toLowerCase()}`;
}
