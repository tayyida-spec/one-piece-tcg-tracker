-- Run this once in Supabase → SQL Editor (or via `prisma db push` with a correct DIRECT_URL).
-- Adds per-user dashboard preferences and the Business Expenses table.

ALTER TABLE "WorkspaceMember"
  ADD COLUMN IF NOT EXISTS "dashboardPrefs" JSONB;

CREATE TABLE IF NOT EXISTS "BusinessExpense" (
  "id"            TEXT NOT NULL,
  "workspaceId"   TEXT NOT NULL,
  "expenseCode"   TEXT,
  "category"      TEXT NOT NULL,
  "itemName"      TEXT NOT NULL,
  "vendor"        TEXT,
  "date"          TIMESTAMP(3) NOT NULL,
  "amount"        DECIMAL(12,2) NOT NULL,
  "paymentMethod" TEXT,
  "recurring"     BOOLEAN NOT NULL DEFAULT false,
  "frequency"     TEXT,
  "owner"         TEXT,
  "reimbursement" TEXT,
  "notes"         TEXT,
  "createdBy"     TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessExpense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BusinessExpense_workspaceId_date_idx"
  ON "BusinessExpense" ("workspaceId", "date");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'BusinessExpense_workspaceId_fkey'
  ) THEN
    ALTER TABLE "BusinessExpense"
      ADD CONSTRAINT "BusinessExpense_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
