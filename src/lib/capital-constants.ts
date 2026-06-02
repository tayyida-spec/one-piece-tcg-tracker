/** Fallback when no capital contributions exist in the database yet. */
export function getEnvCapitalFallback(): number {
  const raw = process.env.WORKSPACE_TOTAL_CAPITAL_SGD;
  if (raw == null || raw === "") return 5000;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5000;
}
