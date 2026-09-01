/**
 * Clean capital contribution notes: remove seed tags, ownership pool wording, and per-row %.
 * Usage: node scripts/migrate-capital-notes.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NOTE_REPLACEMENTS = [
  {
    match: (n) => n.includes("seed-capital-pool") && n.includes("Ownership pool"),
    notes: "Op17 cases pump in",
  },
  {
    match: (n) => n.includes("seed-capital-pool") && n.includes("Catch-up"),
    notes: "Catch-up for 10 Jun 2026 second pump-in",
  },
  {
    match: (n) => n.includes("seed-capital-prior-pumpins") && n.includes("Initial"),
    notes: "Initial workspace capital",
  },
  {
    match: (n) => n.includes("seed-capital-prior-pumpins") && n.includes("Second pump-in"),
    notes: "Second pump-in",
  },
  {
    match: (n) => n.startsWith("Ownership pool"),
    notes: "Op17 cases pump in",
  },
];

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) throw new Error("No workspace found");

  const rows = await prisma.capitalContribution.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { date: "asc" },
  });

  let updated = 0;
  for (const row of rows) {
    const current = row.notes ?? "";
    const rule = NOTE_REPLACEMENTS.find((r) => r.match(current));
    if (!rule || rule.notes === current) continue;
    await prisma.capitalContribution.update({
      where: { id: row.id },
      data: { notes: rule.notes },
    });
    console.log(`${row.contributor}: "${current}" → "${rule.notes}"`);
    updated += 1;
  }

  console.log(`\nUpdated ${updated} row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
