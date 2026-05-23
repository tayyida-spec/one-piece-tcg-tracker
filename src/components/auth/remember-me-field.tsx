"use client";

import { cn } from "@/lib/utils";

export function RememberMeField({
  checked,
  onChange,
  id = "rememberMe",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2 text-sm text-muted",
        "select-none"
      )}
    >
      <input
        id={id}
        name="rememberMe"
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border bg-surface-elevated text-brand accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      <span>
        <span className="font-medium text-foreground">Remember me</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {checked
            ? "Stay signed in for 30 days on this device."
            : "Sign out when you close the browser (better on shared devices)."}
        </span>
      </span>
    </label>
  );
}
