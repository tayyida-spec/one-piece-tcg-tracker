// Applies CapitalContribution + marketPriceUpdatedAt migration.
// Run manually: node scripts/apply-capital-migration.mjs
import { PrismaClient } from "@prisma/client";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL or DIRECT_URL is required.");
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url } } });

async function addCapitalFkIfMissing() {
  const rows = await prisma.$queryRaw`
    SELECT 1 AS ok FROM pg_constraint WHERE conname = 'CapitalContribution_workspaceId_fkey'
  `;
  if (Array.isArray(rows) && rows.length > 0) return;

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "CapitalContribution"
      ADD CONSTRAINT "CapitalContribution_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  `);
}

const STATEMENTS = [
  `ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "marketPriceUpdatedAt" TIMESTAMP(3)`,
  `UPDATE "InventoryItem"
    SET "marketPriceUpdatedAt" = "updatedAt"
    WHERE "currentMarketPrice" IS NOT NULL
      AND "currentMarketPrice" > 0
      AND "marketPriceUpdatedAt" IS NULL`,
  `CREATE TABLE IF NOT EXISTS "CapitalContribution" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "contributor" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CapitalContribution_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "CapitalContribution_workspaceId_date_idx"
    ON "CapitalContribution" ("workspaceId", "date")`,
];

async function main() {
  for (const sql of STATEMENTS) {
    await prisma.$executeRawUnsafe(sql);
    console.log("[migrate] OK:", sql.split("\n")[0].trim().slice(0, 70));
  }
  await addCapitalFkIfMissing();
  console.log("[migrate] Capital + market price migration done.");
}

main()
  .catch((e) => {
    console.error("[migrate] FAILED:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
