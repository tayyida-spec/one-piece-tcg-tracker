/**
 * Reverts SC### sell transactions back to BC### (undoes SC split).
 * Usage: node scripts/migrate-sc-to-bc.mjs [--dry-run]
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

function toBcId(scId) {
  const id = scId.trim();
  if (/^SC/i.test(id)) return `BC${id.slice(2)}`;
  return null;
}

function buildImportKey(displayId, date, transactionType) {
  const datePart = date.toISOString().slice(0, 10);
  return `${displayId.trim()}|${datePart}|${transactionType.trim().toLowerCase()}`;
}

async function main() {
  const workspaces = await prisma.workspace.findMany({ select: { id: true, name: true } });

  for (const ws of workspaces) {
    const scTxns = await prisma.transaction.findMany({
      where: {
        workspaceId: ws.id,
        displayId: { startsWith: "SC", mode: "insensitive" },
      },
    });

    console.log(`\n${ws.name}: ${scTxns.length} SC transaction(s)`);

    for (const txn of scTxns) {
      const bcId = toBcId(txn.displayId);
      if (!bcId) continue;

      const newKey = buildImportKey(bcId, txn.date, txn.transactionType);
      const conflict = await prisma.transaction.findFirst({
        where: { workspaceId: ws.id, importKey: newKey, id: { not: txn.id } },
      });

      if (conflict) {
        console.warn(`  Skip ${txn.displayId} → ${bcId}: ${newKey} already exists`);
        continue;
      }

      console.log(`  ${txn.displayId} → ${bcId}`);
      if (!dryRun) {
        await prisma.transaction.update({
          where: { id: txn.id },
          data: { displayId: bcId, importKey: newKey },
        });
      }
    }
  }

  console.log(dryRun ? "\nDry run done." : "\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
