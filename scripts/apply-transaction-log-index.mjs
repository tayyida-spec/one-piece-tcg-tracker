// Applies transaction log composite index.
// Run: node scripts/apply-transaction-log-index.mjs
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL or DIRECT_URL is required.");
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url } } });
const dir = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(dir, "../prisma/manual-migrations/2026-09-transaction-log-index.sql"),
  "utf8"
);

try {
  await prisma.$executeRawUnsafe(sql);
  console.log("Transaction log index applied.");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
