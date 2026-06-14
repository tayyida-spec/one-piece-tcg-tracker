import { toIsoDateString } from "@/lib/date-format";

export function buildTransactionImportKey(
  displayId: string,
  date: Date | string,
  transactionType: string
) {
  const iso =
    typeof date === "string" ? toIsoDateString(date) : toIsoDateString(date.toISOString());
  const datePart = iso ?? "unknown";
  return `${displayId.trim()}|${datePart}|${transactionType.trim().toLowerCase()}`;
}
