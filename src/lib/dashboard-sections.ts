export const DASHBOARD_SECTIONS = [
  { key: "bc", label: "Buy / Sell cards (BC)" },
  { key: "kpis", label: "Top stats" },
  { key: "snapshot", label: "Portfolio snapshot & ROI" },
  { key: "txn", label: "Case breaks (TXN)" },
  { key: "monthly", label: "Monthly P/L" },
  { key: "expenses", label: "Business expenses" },
  { key: "recent", label: "Recent transactions" },
] as const;

export type DashboardSectionKey = (typeof DASHBOARD_SECTIONS)[number]["key"];

export const DASHBOARD_SECTION_KEYS = DASHBOARD_SECTIONS.map((s) => s.key) as DashboardSectionKey[];

export type DashboardVisibility = Record<DashboardSectionKey, boolean>;

/** Read the persisted dashboardPrefs JSON and return a visibility map (all visible by default). */
export function resolveVisibleSections(prefs: unknown): DashboardVisibility {
  const hidden = new Set<string>();
  if (prefs && typeof prefs === "object" && "hidden" in prefs) {
    const list = (prefs as { hidden?: unknown }).hidden;
    if (Array.isArray(list)) {
      for (const k of list) if (typeof k === "string") hidden.add(k);
    }
  }

  return DASHBOARD_SECTION_KEYS.reduce((acc, key) => {
    acc[key] = !hidden.has(key);
    return acc;
  }, {} as DashboardVisibility);
}

export function visibilityToHidden(visible: DashboardVisibility): string[] {
  return DASHBOARD_SECTION_KEYS.filter((key) => !visible[key]);
}
