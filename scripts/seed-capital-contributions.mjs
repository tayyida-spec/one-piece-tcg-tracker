// Seeds initial workspace capital ($2,000 OP17 cases pump-in).
// Idempotent: skips if workspace already has any capital entries.
// For full reset use: node scripts/seed-capital-pool.mjs
// Run with: node scripts/seed-capital-contributions.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INVITE_CODE = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";

const CONTRIBUTIONS = [
  { contributor: "Ben", amount: 420 },
  { contributor: "Caleb", amount: 420 },
  { contributor: "Timmy", amount: 400 },
  { contributor: "Matthew", amount: 380 },
  { contributor: "Yi Da", amount: 380 },
];

const OP17_NOTE = "Op17 cases pump in";

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
      notes: OP17_NOTE,
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
