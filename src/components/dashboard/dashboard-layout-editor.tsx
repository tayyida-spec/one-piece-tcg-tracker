"use client";

import { useState } from "react";
import { GripVertical, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_SECTIONS,
  DASHBOARD_SECTION_KEYS,
  DEFAULT_DASHBOARD_ORDER,
  type DashboardLayout,
  type DashboardSectionKey,
} from "@/lib/dashboard-sections";
import { cn } from "@/lib/utils";

type Props = {
  layout: DashboardLayout;
  onChange: (layout: DashboardLayout) => void;
  onSave: () => void;
  onCancel: () => void;
  busy: boolean;
  saved: boolean;
};

export function DashboardLayoutEditor({
  layout,
  onChange,
  onSave,
  onCancel,
  busy,
  saved,
}: Props) {
  const [dragKey, setDragKey] = useState<DashboardSectionKey | null>(null);

  function toggleVisible(key: DashboardSectionKey) {
    onChange({
      ...layout,
      visible: { ...layout.visible, [key]: !layout.visible[key] },
    });
  }

  function reorder(dragged: DashboardSectionKey, target: DashboardSectionKey) {
    if (dragged === target) return;
    const next = [...layout.order];
    const from = next.indexOf(dragged);
    const to = next.indexOf(target);
    if (from === -1 || to === -1) return;
    next.splice(from, 1);
    next.splice(to, 0, dragged);
    onChange({ ...layout, order: next });
  }

  function resetDefault() {
    onChange({
      order: [...DEFAULT_DASHBOARD_ORDER],
      visible: DASHBOARD_SECTION_KEYS.reduce(
        (acc, key) => {
          acc[key] = true;
          return acc;
        },
        {} as DashboardLayout["visible"]
      ),
    });
  }

  return (
    <div className="rounded-xl border-2 border-dashed border-brand/50 bg-surface-elevated p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Edit dashboard layout</h2>
        <p className="mt-1 text-sm text-muted">
          Drag sections to reorder. Use the eye icon to show or hide. Saved to your account only.
        </p>
      </div>

      <ul className="space-y-2">
        {layout.order.map((key) => {
          const meta = DASHBOARD_SECTIONS.find((s) => s.key === key);
          if (!meta) return null;
          const isVisible = layout.visible[key];

          return (
            <li
              key={key}
              draggable
              onDragStart={() => setDragKey(key)}
              onDragEnd={() => setDragKey(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragKey) reorder(dragKey, key);
                setDragKey(null);
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-3 transition-shadow",
                dragKey === key && "opacity-50",
                dragKey && dragKey !== key && "hover:border-brand/40"
              )}
            >
              <span
                className="cursor-grab text-muted active:cursor-grabbing"
                title="Drag to reorder"
                aria-hidden
              >
                <GripVertical className="h-5 w-5" />
              </span>
              <span className="flex-1 text-sm font-medium text-foreground">{meta.label}</span>
              <button
                type="button"
                onClick={() => toggleVisible(key)}
                className={cn(
                  "rounded-md p-2 transition-colors",
                  isVisible
                    ? "text-foreground hover:bg-surface-elevated"
                    : "text-muted hover:bg-surface-elevated"
                )}
                title={isVisible ? "Hide section" : "Show section"}
                aria-label={isVisible ? `Hide ${meta.label}` : `Show ${meta.label}`}
              >
                {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button onClick={onSave} disabled={busy}>
          {busy ? "Saving…" : "Save layout"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="ghost" onClick={resetDefault} disabled={busy} type="button">
          Reset to default
        </Button>
        {saved ? <span className="text-xs text-success">Saved</span> : null}
      </div>
    </div>
  );
}
