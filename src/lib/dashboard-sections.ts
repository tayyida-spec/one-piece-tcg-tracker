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

/** Default section order (BC first). */
export const DEFAULT_DASHBOARD_ORDER: DashboardSectionKey[] = [...DASHBOARD_SECTION_KEYS];

const PL_SECTION_KEYS = new Set<DashboardSectionKey>(["bc", "snapshot", "txn", "monthly"]);

export function isPlSectionKey(key: string): key is DashboardSectionKey {
  return PL_SECTION_KEYS.has(key as DashboardSectionKey);
}

export type DashboardVisibility = Record<DashboardSectionKey, boolean>;

export type DashboardLayout = {
  order: DashboardSectionKey[];
  visible: DashboardVisibility;
};

const sectionLabelMap = Object.fromEntries(
  DASHBOARD_SECTIONS.map((s) => [s.key, s.label])
) as Record<DashboardSectionKey, string>;

export function sectionLabel(key: DashboardSectionKey): string {
  return sectionLabelMap[key] ?? key;
}

function isSectionKey(key: string): key is DashboardSectionKey {
  return (DASHBOARD_SECTION_KEYS as readonly string[]).includes(key);
}

/** Merge saved order with defaults — keeps new sections if we add more later. */
export function normalizeSectionOrder(order: unknown): DashboardSectionKey[] {
  const result: DashboardSectionKey[] = [];
  const seen = new Set<string>();

  if (Array.isArray(order)) {
    for (const key of order) {
      if (typeof key === "string" && isSectionKey(key) && !seen.has(key)) {
        result.push(key);
        seen.add(key);
      }
    }
  }

  for (const key of DEFAULT_DASHBOARD_ORDER) {
    if (!seen.has(key)) {
      result.push(key);
      seen.add(key);
    }
  }

  return result;
}

/** Read persisted dashboardPrefs JSON. */
export function resolveDashboardLayout(prefs: unknown): DashboardLayout {
  const hidden = new Set<string>();
  let order: unknown;

  if (prefs && typeof prefs === "object") {
    if ("hidden" in prefs) {
      const list = (prefs as { hidden?: unknown }).hidden;
      if (Array.isArray(list)) {
        for (const k of list) if (typeof k === "string") hidden.add(k);
      }
    }
    if ("order" in prefs) {
      order = (prefs as { order?: unknown }).order;
    }
  }

  const visible = DASHBOARD_SECTION_KEYS.reduce((acc, key) => {
    acc[key] = !hidden.has(key);
    return acc;
  }, {} as DashboardVisibility);

  return {
    order: normalizeSectionOrder(order),
    visible,
  };
}

export function layoutToPrefs(layout: DashboardLayout): { hidden: string[]; order: string[] } {
  return {
    hidden: DASHBOARD_SECTION_KEYS.filter((key) => !layout.visible[key]),
    order: [...layout.order],
  };
}

/** @deprecated Use resolveDashboardLayout */
export function resolveVisibleSections(prefs: unknown): DashboardVisibility {
  return resolveDashboardLayout(prefs).visible;
}

/** @deprecated Use layoutToPrefs */
export function visibilityToHidden(visible: DashboardVisibility): string[] {
  return DASHBOARD_SECTION_KEYS.filter((key) => !visible[key]);
}

export function orderForPlSections(order: DashboardSectionKey[]): DashboardSectionKey[] {
  return order.filter((key) => isPlSectionKey(key));
}
