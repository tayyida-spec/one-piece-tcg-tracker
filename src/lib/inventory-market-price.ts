/** True when market price value changed (including first-time set). */
export function marketPriceChanged(
  existing: number | null | undefined,
  incoming: number | null | undefined
): boolean {
  const prev = existing != null ? Number(existing) : null;
  const next = incoming != null ? Number(incoming) : null;
  if (prev === next) return false;
  if (prev == null && next == null) return false;
  if (prev == null || next == null) return true;
  return Math.abs(prev - next) > 0.0001;
}

export function marketPriceUpdateFields(
  existingPrice: unknown,
  incomingPrice: unknown
): { marketPriceUpdatedAt?: Date } {
  if (!marketPriceChanged(
    existingPrice != null ? Number(existingPrice) : null,
    incomingPrice != null ? Number(incomingPrice) : null
  )) {
    return {};
  }
  return { marketPriceUpdatedAt: new Date() };
}
