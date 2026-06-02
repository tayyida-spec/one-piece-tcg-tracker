-- Capital contributions + market price freshness tracking.
-- Run once in Supabase → SQL Editor (idempotent).

ALTER TABLE "InventoryItem"
  ADD COLUMN IF NOT EXISTS "marketPriceUpdatedAt" TIMESTAMP(3);

UPDATE "InventoryItem"
SET "marketPriceUpdatedAt" = "updatedAt"
WHERE "currentMarketPrice" IS NOT NULL
  AND "currentMarketPrice" > 0
  AND "marketPriceUpdatedAt" IS NULL;

CREATE TABLE IF NOT EXISTS "CapitalContribution" (
  "id"          TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "date"        TIMESTAMP(3) NOT NULL,
  "amount"      DECIMAL(12,2) NOT NULL,
  "contributor" TEXT,
  "notes"       TEXT,
  "createdBy"   TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CapitalContribution_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CapitalContribution_workspaceId_date_idx"
  ON "CapitalContribution" ("workspaceId", "date");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CapitalContribution_workspaceId_fkey'
  ) THEN
    ALTER TABLE "CapitalContribution"
      ADD CONSTRAINT "CapitalContribution_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
