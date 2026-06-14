// Recalculate inventory purchasePrice from buy transaction unit prices.
// Run: npx tsx scripts/sync-inventory-costs.ts
import { PrismaClient } from "@prisma/client";
import { recalcAllInventoryPurchasePrices } from "../src/lib/inventory-cost-sync";

const prisma = new PrismaClient();
const INVITE_CODE = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";

async function main() {
  const workspace = await prisma.workspace.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (!workspace) {
    console.error(`[sync:inventory-costs] Workspace "${INVITE_CODE}" not found.`);
    process.exit(1);
  }

  console.log(`[sync:inventory-costs] Recalculating costs for ${workspace.name}…`);
  const result = await recalcAllInventoryPurchasePrices(workspace.id);
  console.log(
    `[sync:inventory-costs] Done — ${result.updated} of ${result.total} inventory row(s) updated.`
  );
}

main()
  .catch((e) => {
    console.error("[sync:inventory-costs] FAILED:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
