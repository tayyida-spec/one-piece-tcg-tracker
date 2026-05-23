import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatDate(value: Date | string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Display format for table cells (matches {@link formatDate}). */
export function formatExcelDate(value: Date | string) {
  return formatDate(value);
}

export function formatExcelNumber(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}

export function displayItemType(itemType: string) {
  const t = itemType.toLowerCase();
  if (t === "sealed" || t === "case") return "Case";
  if (t === "merchandise") return "Merchandise";
  return "Cards";
}

export function displayTransactionType(type: string) {
  const t = type.toLowerCase();
  if (t === "buy") return "Buy";
  if (t === "sell") return "Sell";
  if (t === "trade") return "Trade";
  if (t === "gift") return "Gift";
  return "Adjustment";
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
