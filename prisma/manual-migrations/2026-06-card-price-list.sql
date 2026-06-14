-- Card price list (SGD) synced from inventory market prices.
-- Run once in Supabase → SQL Editor (idempotent).

CREATE TABLE IF NOT EXISTS "CardPriceEntry" (
  "id"              TEXT NOT NULL,
  "workspaceId"     TEXT NOT NULL,
  "itemType"        TEXT NOT NULL DEFAULT 'card',
  "cardName"        TEXT NOT NULL,
  "cardId"          TEXT NOT NULL,
  "series"          TEXT NOT NULL DEFAULT '',
  "rarity"          TEXT NOT NULL DEFAULT '',
  "language"        TEXT NOT NULL DEFAULT 'JP',
  "variant"         TEXT NOT NULL DEFAULT '',
  "marketPriceSgd"  DECIMAL(12,2),
  "priceUpdatedAt"  TIMESTAMP(3),
  "inventoryItemId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CardPriceEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CardPriceEntry_workspaceId_itemType_cardId_series_rarity_variant_language_key"
  ON "CardPriceEntry" ("workspaceId", "itemType", "cardId", "series", "rarity", "variant", "language");

CREATE INDEX IF NOT EXISTS "CardPriceEntry_workspaceId_cardName_idx"
  ON "CardPriceEntry" ("workspaceId", "cardName");

CREATE INDEX IF NOT EXISTS "CardPriceEntry_workspaceId_series_idx"
  ON "CardPriceEntry" ("workspaceId", "series");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CardPriceEntry_workspaceId_fkey'
  ) THEN
    ALTER TABLE "CardPriceEntry"
      ADD CONSTRAINT "CardPriceEntry_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill from existing card inventory (SGD market prices).
INSERT INTO "CardPriceEntry" (
  "id",
  "workspaceId",
  "itemType",
  "cardName",
  "cardId",
  "series",
  "rarity",
  "language",
  "variant",
  "marketPriceSgd",
  "priceUpdatedAt",
  "inventoryItemId",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  i."workspaceId",
  i."itemType",
  i."cardName",
  i."cardId",
  i."series",
  i."rarity",
  i."language",
  i."variant",
  i."currentMarketPrice",
  i."marketPriceUpdatedAt",
  i."id",
  NOW(),
  NOW()
FROM "InventoryItem" i
WHERE i."itemType" = 'card'
  AND NOT EXISTS (
    SELECT 1 FROM "CardPriceEntry" c
    WHERE c."workspaceId" = i."workspaceId"
      AND c."itemType" = i."itemType"
      AND c."cardId" = i."cardId"
      AND c."series" = i."series"
      AND c."rarity" = i."rarity"
      AND c."variant" = i."variant"
      AND c."language" = i."language"
  );
