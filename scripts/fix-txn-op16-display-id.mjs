/**
 * Fix orphaned OP-16 case buy (displayId "TXN") → TXN002 to pair with TXN002 sells.
 * Usage: node scripts/fix-txn-op16-display-id.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) throw new Error("No workspace found");

  const orphan = await prisma.transaction.findFirst({
    where: {
      workspaceId: workspace.id,
      displayId: "TXN",
      transactionType: "buy",
    },
    include: { lines: true },
  });

  if (!orphan) {
    console.log('No bare "TXN" buy found — already fixed.');
    return;
  }

  const newDisplayId = "TXN002";
  const datePart = orphan.date.toISOString().slice(0, 10);
  const newImportKey = `${newDisplayId}|${datePart}|buy`;

  const conflict = await prisma.transaction.findFirst({
    where: { workspaceId: workspace.id, importKey: newImportKey },
  });
  if (conflict) {
    throw new Error(`Import key conflict: ${newImportKey}`);
  }

  await prisma.transaction.update({
    where: { id: orphan.id },
    data: {
      displayId: newDisplayId,
      importKey: newImportKey,
      batchLabel: "OP16 case break",
      notes: orphan.notes ?? "OP-16 case purchase",
    },
  });

  console.log(`Updated OP-16 case buy: TXN → ${newDisplayId} (${datePart}, S$${orphan.lines[0]?.unitPrice})`);

  const txn003 = await prisma.transaction.count({
    where: { workspaceId: workspace.id, displayId: "TXN003" },
  });
  const txn002 = await prisma.transaction.count({
    where: { workspaceId: workspace.id, displayId: "TXN002" },
  });
  console.log(`TXN002 transactions: ${txn002}, TXN003 transactions: ${txn003}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
