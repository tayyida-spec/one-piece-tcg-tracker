"use client";

import { Input } from "@/components/ui/input";
import { isoToDisplayDate } from "@/lib/date-format";

type Props = {
  id: string;
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
};

function toDisplay(value: string | undefined): string {
  if (!value) return "";
  return value.includes("-") ? isoToDisplayDate(value) : value;
}

/** Text input for dates in DD/MM/YYYY format. */
export function DateInput({ id, name, defaultValue, value, onChange, required, className }: Props) {
  if (value !== undefined && onChange) {
    return (
      <Input
        id={id}
        name={name}
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        value={toDisplay(value)}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={className}
        autoComplete="off"
        spellCheck={false}
      />
    );
  }

  return (
    <Input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/YYYY"
      defaultValue={toDisplay(defaultValue)}
      required={required}
      className={className}
      autoComplete="off"
      spellCheck={false}
    />
  );
}
