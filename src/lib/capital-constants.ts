/** Fallback when no capital contributions exist in the database yet. */
export function getEnvCapitalFallback(): number {
  const raw = process.env.WORKSPACE_TOTAL_CAPITAL_SGD;
  if (raw == null || raw === "") return 5000;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5000;
}

/** Shown under Total pumped in on the Capital page. */
export const CAPITAL_OWNERSHIP_SPLIT_NOTE =
  "Ben 21% · Caleb 21% · Timmy 20% · Matthew 19% · Yi Da 19%";
