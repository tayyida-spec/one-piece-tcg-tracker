import { NextResponse } from "next/server";
import { checkSupabaseHealth } from "@/lib/supabase-health";

export const dynamic = "force-dynamic";

/** Diagnostic: open /api/setup-check in the browser to verify Supabase env. */
export async function GET() {
  const supabase = await checkSupabaseHealth();
  const hasDbUrl = Boolean(process.env.DATABASE_URL?.trim());

  return NextResponse.json({
    supabase,
    databaseUrlConfigured: hasDbUrl,
    nodeEnv: process.env.NODE_ENV ?? "unknown",
  });
}
