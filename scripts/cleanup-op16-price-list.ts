// Remove non-OP16 price list rows and translate names to English.
// Run: npx tsx scripts/cleanup-op16-price-list.ts
import { PrismaClient } from "@prisma/client";
import { cleanupOp16PriceList } from "../src/lib/card-price-cleanup";

const prisma = new PrismaClient();
const INVITE_CODE = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";

async function main() {
  const workspace = await prisma.workspace.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (!workspace) {
    console.error(`[cleanup:op16-prices] Workspace "${INVITE_CODE}" not found.`);
    process.exit(1);
  }

  console.log(`[cleanup:op16-prices] Cleaning price list for ${workspace.name}…`);
  const result = await cleanupOp16PriceList(workspace.id);
  console.log(
    `[cleanup:op16-prices] Removed ${result.removed} non-OP16 row(s), unlinked ${result.unlinked} inventory link(s), translated ${result.translated} name(s).`
  );
}

main()
  .catch((e) => {
    console.error("[cleanup:op16-prices] FAILED:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
