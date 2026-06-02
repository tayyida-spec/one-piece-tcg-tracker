// Seeds initial workspace capital contributions ($5,000 total).
// Idempotent: skips if workspace already has any capital entries.
// Run with: node scripts/seed-capital-contributions.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INVITE_CODE = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";

/** Initial pump-in breakdown — total S$5,000 */
const CONTRIBUTIONS = [
  { contributor: "Ben", amount: 1050, notes: "Initial workspace capital" },
  { contributor: "Caleb", amount: 1050, notes: "Initial workspace capital" },
  { contributor: "Timmy", amount: 1000, notes: "Initial workspace capital" },
  { contributor: "Yi Da", amount: 950, notes: "Initial workspace capital" },
  { contributor: "Matt", amount: 950, notes: "Initial workspace capital" },
];

async function main() {
  const workspace = await prisma.workspace.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (!workspace) {
    console.log(`[seed:capital] Workspace "${INVITE_CODE}" not found — skipping seed.`);
    return;
  }

  const existingCount = await prisma.capitalContribution.count({
    where: { workspaceId: workspace.id },
  });
  if (existingCount > 0) {
    console.log(`[seed:capital] Workspace already has ${existingCount} contribution(s) — skipping seed.`);
    return;
  }

  const seedDate = new Date("2026-01-01");

  await prisma.capitalContribution.createMany({
    data: CONTRIBUTIONS.map((c) => ({
      workspaceId: workspace.id,
      date: seedDate,
      amount: c.amount,
      contributor: c.contributor,
      notes: c.notes,
    })),
  });

  const total = CONTRIBUTIONS.reduce((s, c) => s + c.amount, 0);
  console.log(
    `[seed:capital] Inserted ${CONTRIBUTIONS.length} contributions. Total: S$${total.toFixed(2)}`
  );
}

main()
  .catch((e) => {
    console.error("[seed:capital] Skipped due to error:", e.message);
  })
  .finally(() => prisma.$disconnect());
