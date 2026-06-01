// Applies Business Expenses + dashboardPrefs migration. Use DIRECT_URL (port 5432), not the pooler.
// Run manually: npm run db:bootstrap
import { PrismaClient } from "@prisma/client";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL or DIRECT_URL is required.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url } },
});

async function addForeignKeyIfMissing() {
  const rows = await prisma.$queryRaw`
    SELECT 1 AS ok FROM pg_constraint WHERE conname = 'BusinessExpense_workspaceId_fkey'
  `;
  if (Array.isArray(rows) && rows.length > 0) return;

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "BusinessExpense"
      ADD CONSTRAINT "BusinessExpense_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
      ON DELETE CASCADE ON UPDATE CASCADE
  `);
}

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
];

async function main() {
  for (const sql of STATEMENTS) {
    await prisma.$executeRawUnsafe(sql);
    console.log("[migrate] OK:", sql.split("\n")[0].trim().slice(0, 70));
  }
  await addForeignKeyIfMissing();
  console.log("[migrate] Foreign key OK");
  console.log("[migrate] Done.");
}

main()
  .catch((e) => {
    console.error("[migrate] FAILED:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
