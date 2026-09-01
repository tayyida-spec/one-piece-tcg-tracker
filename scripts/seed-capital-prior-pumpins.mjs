/**
 * Restore prior pumped-in capital (S$11,100) removed by seed-capital-pool.mjs.
 * Idempotent: removes prior rows tagged seed-capital-prior-pumpins, then re-inserts.
 * Usage: node scripts/seed-capital-prior-pumpins.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_TAG = "seed-capital-prior-pumpins";
const INVITE_CODE = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";

const INITIAL_DATE = new Date("2026-01-01T00:00:00.000Z");
const SECOND_PUMP_DATE = new Date("2026-06-10T00:00:00.000Z");

/** First pump-in — S$5,025 total (Matthew S$975 per DB before Aug 2026 reset). */
const INITIAL_PUMPINS = [
  { contributor: "Ben", amount: 1050, notes: `${SEED_TAG} — Initial workspace capital` },
  { contributor: "Caleb", amount: 1050, notes: `${SEED_TAG} — Initial workspace capital` },
  { contributor: "Timmy", amount: 1000, notes: `${SEED_TAG} — Initial workspace capital` },
  { contributor: "Yi Da", amount: 950, notes: `${SEED_TAG} — Initial workspace capital` },
  { contributor: "Matthew", amount: 975, notes: `${SEED_TAG} — Initial workspace capital` },
];

/**
 * Second pump-in (10 Jun 2026) — S$7,500 pool by ownership %.
 * Matthew had not paid his 19% (S$1,425) at the time these were recorded.
 */
const SECOND_PUMPINS = [
  { contributor: "Ben", amount: 1575, pct: "21%", notes: `${SEED_TAG} — Second pump-in 21% (S$1,575 of S$7,500)` },
  { contributor: "Caleb", amount: 1575, pct: "21%", notes: `${SEED_TAG} — Second pump-in 21% (S$1,575 of S$7,500)` },
  { contributor: "Timmy", amount: 1500, pct: "20%", notes: `${SEED_TAG} — Second pump-in 20% (S$1,500 of S$7,500)` },
  { contributor: "Yi Da", amount: 1425, pct: "19%", notes: `${SEED_TAG} — Second pump-in 19% (S$1,425 of S$7,500)` },
];

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
    console.log(`Removed ${deleted.count} prior seeded row(s) tagged ${SEED_TAG}.`);
  }

  const rows = [
    ...INITIAL_PUMPINS.map((c) => ({
      workspaceId: workspace.id,
      date: INITIAL_DATE,
      amount: c.amount,
      contributor: c.contributor,
      notes: c.notes,
    })),
    ...SECOND_PUMPINS.map((c) => ({
      workspaceId: workspace.id,
      date: SECOND_PUMP_DATE,
      amount: c.amount,
      contributor: c.contributor,
      notes: c.notes,
    })),
  ];

  await prisma.capitalContribution.createMany({ data: rows });

  const initialTotal = INITIAL_PUMPINS.reduce((s, c) => s + c.amount, 0);
  const secondTotal = SECOND_PUMPINS.reduce((s, c) => s + c.amount, 0);
  const restoredTotal = initialTotal + secondTotal;

  console.log("\nRestored prior pump-ins:");
  console.log(`  Initial (${INITIAL_DATE.toISOString().slice(0, 10)}): S$${initialTotal.toFixed(2)}`);
  for (const c of INITIAL_PUMPINS) {
    console.log(`    ${c.contributor}: S$${c.amount.toFixed(2)}`);
  }
  console.log(`  Second pump-in (${SECOND_PUMP_DATE.toISOString().slice(0, 10)}): S$${secondTotal.toFixed(2)}`);
  for (const c of SECOND_PUMPINS) {
    console.log(`    ${c.contributor}: S$${c.amount.toFixed(2)}`);
  }
  console.log(`\nRestored prior total: S$${restoredTotal.toFixed(2)}`);

  const all = await prisma.capitalContribution.findMany({ where: { workspaceId: workspace.id } });
  const grandTotal = all.reduce((s, c) => s + Number(c.amount), 0);
  console.log(`Workspace capital total (all entries): S$${grandTotal.toFixed(2)} (${all.length} rows)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
