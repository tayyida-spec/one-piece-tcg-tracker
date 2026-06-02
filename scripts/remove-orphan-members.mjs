/**
 * Remove workspace member rows whose Supabase auth user no longer exists (no email).
 * Usage: node scripts/remove-orphan-members.mjs [--dry-run]
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function main() {
  const admin = adminClient();
  const workspace = await prisma.workspace.findFirst({ orderBy: { createdAt: "asc" } });
  if (!workspace) {
    console.log("No workspace found.");
    return;
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  const toDelete = [];

  for (const m of members) {
    let email = null;
    try {
      const { data, error } = await admin.auth.admin.getUserById(m.userId);
      if (!error && data.user?.email) email = data.user.email;
    } catch {
      /* treat as orphan */
    }

    if (!email) {
      toDelete.push(m);
      console.log(
        `[orphan] memberId=${m.id} userId=${m.userId} name=${m.displayName ?? "—"} role=${m.role}`
      );
    }
  }

  if (toDelete.length === 0) {
    console.log("No orphan members found.");
    return;
  }

  if (dryRun) {
    console.log(`Dry run — would delete ${toDelete.length} member(s).`);
    return;
  }

  for (const m of toDelete) {
    await prisma.workspaceMember.delete({ where: { id: m.id } });
    console.log(`Deleted member ${m.id} (${m.displayName ?? "—"})`);
  }

  console.log(`Done. Removed ${toDelete.length} orphan member(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
