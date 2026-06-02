import { NextResponse } from "next/server";
import { applyPersistPreferenceCookie } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

/** Clears the remember-me persist flag (httpOnly). Auth cookies cleared by Supabase client. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  applyPersistPreferenceCookie(response, false);
  return response;
}
