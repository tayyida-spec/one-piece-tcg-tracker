/** Parse ISO or Date to local calendar parts (avoids UTC off-by-one). */
function toLocalParts(value: Date | string): { y: number; m: number; d: number } | null {
  if (typeof value === "string") {
    const iso = value.trim().slice(0, 10);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (m) {
      return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
    }
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
  };
}

/** Display as DD/MM/YYYY (en-GB). */
export function formatDate(value: Date | string): string {
  const p = toLocalParts(value);
  if (!p) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(p.y, p.m - 1, p.d));
}

export function formatExcelDate(value: Date | string): string {
  return formatDate(value);
}

/** Today as DD/MM/YYYY. */
export function todayDisplayDate(): string {
  return formatDate(new Date());
}

/** ISO yyyy-mm-dd for APIs from Date, ISO string, or DD/MM/YYYY input. */
export function toIsoDateString(value: Date | string): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (dmy) {
      const day = Number(dmy[1]);
      const month = Number(dmy[2]);
      const year = Number(dmy[3]);
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
      return null;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed.slice(0, 10))) {
      return trimmed.slice(0, 10);
    }
  }
  const p = toLocalParts(value);
  if (!p) return null;
  return `${String(p.y).padStart(4, "0")}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** ISO yyyy-mm-dd → DD/MM/YYYY for form fields. */
export function isoToDisplayDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return formatDate(iso);
}

/** Parse DD/MM/YYYY or ISO to a Date at local noon (safe for DB date columns). */
export function parseApiDate(value: string): Date {
  const iso = toIsoDateString(value);
  if (!iso) {
    throw new Error("Invalid date — use DD/MM/YYYY");
  }
  return new Date(`${iso}T12:00:00`);
}
