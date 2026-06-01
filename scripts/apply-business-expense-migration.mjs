// Applies the Business Expenses + dashboardPrefs migration over the runtime (pooler) connection.
// Safe/idempotent. Run with: node scripts/apply-business-expense-migration.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STATEMENTS = [
  `ALTER TABLE "WorkspaceMember" ADD COLUMN IF NOT EXISTS "dashboardPrefs" JSONB`,
  `CREATE TABLE IF NOT EXISTS "BusinessExpense" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "expenseCode" TEXT,
    "category" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "vendor" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "frequency" TEXT,
    "owner" TEXT,
    "reimbursement" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BusinessExpense_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "BusinessExpense_workspaceId_date_idx" ON "BusinessExpense" ("workspaceId", "date")`,
  `DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BusinessExpense_workspaceId_fkey') THEN
      ALTER TABLE "BusinessExpense"
        ADD CONSTRAINT "BusinessExpense_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END $$`,
];

async function main() {
  for (const sql of STATEMENTS) {
    await prisma.$executeRawUnsafe(sql);
    console.log("OK:", sql.split("\n")[0].trim().slice(0, 60));
  }
  console.log("Migration applied.");
}

main()
  .catch((e) => {
    console.error("FAILED:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
