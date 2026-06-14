// Applies CardPriceEntry table + backfill from inventory.
// Run manually: node scripts/apply-card-price-migration.mjs
import { PrismaClient } from "@prisma/client";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL or DIRECT_URL is required.");
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url } } });

async function addCardPriceFkIfMissing() {
  const rows = await prisma.$queryRaw`
    SELECT 1 AS ok FROM pg_constraint WHERE conname = 'CardPriceEntry_workspaceId_fkey'
  `;
  if (Array.isArray(rows) && rows.length > 0) return;

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CardPriceEntry"
      ADD CONSTRAINT "CardPriceEntry_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  `);
}

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "CardPriceEntry" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL DEFAULT 'card',
    "cardName" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "series" TEXT NOT NULL DEFAULT '',
    "rarity" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'JP',
    "variant" TEXT NOT NULL DEFAULT '',
    "marketPriceSgd" DECIMAL(12,2),
    "priceUpdatedAt" TIMESTAMP(3),
    "inventoryItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CardPriceEntry_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "CardPriceEntry_workspaceId_itemType_cardId_series_rarity_variant_language_key"
    ON "CardPriceEntry" ("workspaceId", "itemType", "cardId", "series", "rarity", "variant", "language")`,
  `CREATE INDEX IF NOT EXISTS "CardPriceEntry_workspaceId_cardName_idx"
    ON "CardPriceEntry" ("workspaceId", "cardName")`,
  `CREATE INDEX IF NOT EXISTS "CardPriceEntry_workspaceId_series_idx"
    ON "CardPriceEntry" ("workspaceId", "series")`,
  `INSERT INTO "CardPriceEntry" (
    "id", "workspaceId", "itemType", "cardName", "cardId", "series", "rarity", "language", "variant",
    "marketPriceSgd", "priceUpdatedAt", "inventoryItemId", "createdAt", "updatedAt"
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
    )`,
];

async function main() {
  for (const sql of STATEMENTS) {
    await prisma.$executeRawUnsafe(sql);
    console.log("[migrate] OK:", sql.split("\n")[0].trim().slice(0, 70));
  }
  await addCardPriceFkIfMissing();
  console.log("[migrate] Card price list migration done.");
}

main()
  .catch((e) => {
    console.error("[migrate] FAILED:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
