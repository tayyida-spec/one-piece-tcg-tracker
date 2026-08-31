import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkSupabaseHealth } from "@/lib/supabase-health";

export const dynamic = "force-dynamic";

/** Diagnostic: open /api/setup-check in the browser to verify Supabase + Prisma env. */
export async function GET() {
  const supabase = await checkSupabaseHealth();
  const dbUrl = process.env.DATABASE_URL?.trim() ?? "";

  let database: { ok: boolean; message: string; memberFound?: boolean } = {
    ok: false,
    message: "DATABASE_URL is not set.",
  };

  if (dbUrl) {
    try {
      await prisma.$queryRaw`SELECT 1 AS ok`;
      const member = await prisma.workspaceMember.findFirst({
        take: 1,
        select: { id: true },
      });
      database = {
        ok: true,
        message: "Prisma can query the database.",
        memberFound: Boolean(member),
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("[setup-check] prisma failed:", message);
      database = { ok: false, message };
    }
  }

  return NextResponse.json({
    supabase,
    database,
    databaseUrlConfigured: Boolean(dbUrl),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
