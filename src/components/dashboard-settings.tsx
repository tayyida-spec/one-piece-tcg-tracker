"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_SECTIONS,
  visibilityToHidden,
  type DashboardVisibility,
} from "@/lib/dashboard-sections";

export function DashboardSettings({ initial }: { initial: DashboardVisibility }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState<DashboardVisibility>(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggle(key: keyof DashboardVisibility) {
    setVisible((v) => ({ ...v, [key]: !v[key] }));
    setSaved(false);
  }

  async function save() {
    setBusy(true);
    setSaved(false);
    try {
      const res = await fetch("/api/dashboard-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: visibilityToHidden(visible) }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        <SlidersHorizontal className="h-4 w-4" /> Customize
      </Button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-border bg-surface p-4 shadow-lg">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Show on my dashboard
          </p>
          <div className="space-y-2">
            {DASHBOARD_SECTIONS.map((s) => (
              <label key={s.key} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={visible[s.key]}
                  onChange={() => toggle(s.key)}
                  className="h-4 w-4"
                />
                {s.label}
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
            {saved && <span className="text-xs text-success">Saved</span>}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Saved to your account.</p>
        </div>
      )}
    </div>
  );
}
