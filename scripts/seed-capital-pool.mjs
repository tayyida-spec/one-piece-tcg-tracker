/**
 * Seed OP17 cases pump-in ($2,000) + Matthew June catch-up (additive; keeps prior pump-ins).
 * Idempotent: removes prior OP17 pump-in rows, then re-inserts.
 * Usage: node scripts/seed-capital-pool.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INVITE_CODE = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";

const OP17_PUMP_IN = [
  { contributor: "Ben", amount: 420 },
  { contributor: "Caleb", amount: 420 },
  { contributor: "Timmy", amount: 400 },
  { contributor: "Matthew", amount: 380 },
  { contributor: "Yi Da", amount: 380 },
];

const MATTHEW_CATCHUP = {
  contributor: "Matthew",
  amount: 1425,
  date: new Date("2026-08-31T00:00:00.000Z"),
  notes: "Catch-up for 10 Jun 2026 second pump-in",
};

const POOL_DATE = new Date("2026-08-31T00:00:00.000Z");
const OP17_NOTE = "Op17 cases pump in";

async function main() {
  const workspace = await prisma.workspace.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (!workspace) {
    console.error(`Workspace "${INVITE_CODE}" not found.`);
    process.exit(1);
  }

  const deleted = await prisma.capitalContribution.deleteMany({
    where: {
      workspaceId: workspace.id,
      OR: [
        { notes: OP17_NOTE, date: POOL_DATE },
        { notes: MATTHEW_CATCHUP.notes, contributor: MATTHEW_CATCHUP.contributor, date: MATTHEW_CATCHUP.date },
        { notes: { contains: "seed-capital-pool" } },
      ],
    },
  });
  if (deleted.count > 0) {
    console.log(`Removed ${deleted.count} prior OP17 pump-in row(s).`);
  }

  const poolRows = OP17_PUMP_IN.map((c) => ({
    workspaceId: workspace.id,
    date: POOL_DATE,
    amount: c.amount,
    contributor: c.contributor,
    notes: OP17_NOTE,
  }));

  await prisma.capitalContribution.createMany({
    data: [...poolRows, { workspaceId: workspace.id, ...MATTHEW_CATCHUP }],
  });

  const poolTotal = OP17_PUMP_IN.reduce((s, c) => s + c.amount, 0);
  const grandTotal = poolTotal + MATTHEW_CATCHUP.amount;

  console.log("\nOP17 cases pump in (S$2,000):");
  for (const c of OP17_PUMP_IN) {
    console.log(`  ${c.contributor}: S$${c.amount.toFixed(2)}`);
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
