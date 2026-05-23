export type InventoryIdentity = {
  itemType: string;
  cardId: string;
  series: string;
  rarity: string;
  variant: string;
  language: string;
};

export function normalizeIdentity(input: Partial<InventoryIdentity>): InventoryIdentity {
  return {
    itemType: (input.itemType ?? "card").trim().toLowerCase(),
    cardId: (input.cardId ?? "").trim(),
    series: (input.series ?? "").trim(),
    rarity: (input.rarity ?? "").trim(),
    variant: (input.variant ?? "").trim(),
    language: (input.language ?? "JP").trim().toUpperCase(),
  };
}

export function identityKey(identity: InventoryIdentity) {
  const n = normalizeIdentity(identity);
  return [n.itemType, n.cardId, n.series, n.rarity, n.variant, n.language].join("|");
}
