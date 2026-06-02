import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const dup = await prisma.workspaceMember.findFirst({
    where: { displayName: "Yi Da", role: "member" },
  });
  if (!dup) {
    console.log("[delete-member] No duplicate Yi Da member row found.");
    return;
  }
  console.log("[delete-member] Removing:", dup.id, dup.userId);
  await prisma.workspaceMember.delete({ where: { id: dup.id } });
  console.log("[delete-member] Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
