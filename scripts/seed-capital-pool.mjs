/**
 * Seed $2,000 ownership pool + Matthew June catch-up (additive; keeps prior pump-ins).
 * Idempotent: removes only rows tagged seed-capital-pool, then re-inserts.
 * Usage: node scripts/seed-capital-pool.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_TAG = "seed-capital-pool";
const INVITE_CODE = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";

/** $2,000 total workspace capital by ownership % */
const OWNERSHIP_POOL = [
  { contributor: "Ben", amount: 420, pct: "21%" },
  { contributor: "Caleb", amount: 420, pct: "21%" },
  { contributor: "Timmy", amount: 400, pct: "20%" },
  { contributor: "Matthew", amount: 380, pct: "19%" },
  { contributor: "Yi Da", amount: 380, pct: "19%" },
];

/**
 * June 10 2026 second pump-in: Ben/Caleb paid $1,575 (21% of $7,500).
 * Matthew missed his 19% share = $1,425.
 */
const MATTHEW_CATCHUP = {
  contributor: "Matthew",
  amount: 1425,
  date: new Date("2026-08-31T00:00:00.000Z"),
  notes: `${SEED_TAG} — Catch-up for 10 Jun 2026 second pump-in (19% of S$7,500 pool)`,
};

const POOL_DATE = new Date("2026-08-31T00:00:00.000Z");

async function main() {
  const workspace = await prisma.workspace.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (!workspace) {
    console.error(`Workspace "${INVITE_CODE}" not found.`);
    process.exit(1);
  }

  const deleted = await prisma.capitalContribution.deleteMany({
    where: { workspaceId: workspace.id, notes: { contains: SEED_TAG } },
  });
  if (deleted.count > 0) {
    console.log(`Removed ${deleted.count} prior row(s) tagged ${SEED_TAG}.`);
  }

  const poolRows = OWNERSHIP_POOL.map((c) => ({
    workspaceId: workspace.id,
    date: POOL_DATE,
    amount: c.amount,
    contributor: c.contributor,
    notes: `${SEED_TAG} — Ownership pool ${c.pct} (S$${c.amount} of S$2,000)`,
  }));

  await prisma.capitalContribution.createMany({
    data: [...poolRows, { workspaceId: workspace.id, ...MATTHEW_CATCHUP }],
  });

  const poolTotal = OWNERSHIP_POOL.reduce((s, c) => s + c.amount, 0);
  const grandTotal = poolTotal + MATTHEW_CATCHUP.amount;

  console.log("\nOwnership pool (S$2,000):");
  for (const c of OWNERSHIP_POOL) {
    console.log(`  ${c.contributor}: S$${c.amount.toFixed(2)} (${c.pct})`);
  }
  console.log(`\nMatthew catch-up: S$${MATTHEW_CATCHUP.amount.toFixed(2)}`);
  console.log(`Total pumped-in capital: S$${grandTotal.toFixed(2)}`);
  console.log("(DB sum drives Remaining capital; env fallback is S$2,000 if DB empty)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
