// One-time OP16 price import from YuYu-Tei (JPY retail → SGD).
// Run: npx tsx scripts/import-yyt-op16-prices.ts
import { PrismaClient } from "@prisma/client";
import { importYuyuTeiOp16Prices } from "../src/lib/yuyu-tei-import";

const prisma = new PrismaClient();
const INVITE_CODE = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";

async function main() {
  const workspace = await prisma.workspace.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (!workspace) {
    console.error(`[import:yyt-op16] Workspace "${INVITE_CODE}" not found.`);
    process.exit(1);
  }

  console.log(`[import:yyt-op16] Importing OP16 prices for workspace ${workspace.name}…`);
  const result = await importYuyuTeiOp16Prices(workspace.id);
  console.log(
    `[import:yyt-op16] Done — ${result.imported} price list rows (rate ${result.rate}).`
  );
}

main()
  .catch((e) => {
    console.error("[import:yyt-op16] FAILED:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
