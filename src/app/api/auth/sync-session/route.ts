import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  applyPersistPreferenceCookie,
  getSupabaseAuthStorageKey,
  isSupabaseAuthCookie,
  rememberMeCookieOptions,
} from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

const syncSchema = z.object({
  rememberMe: z.boolean().optional().default(true),
});

/** Re-applies Supabase auth cookie max-age after browser sign-in (no Supabase network call). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = syncSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { rememberMe } = parsed.data;
    const storageKey = getSupabaseAuthStorageKey();
    const cookieStore = await cookies();
    const authCookies = cookieStore
      .getAll()
      .filter(({ name }) => isSupabaseAuthCookie(name, storageKey));

    if (authCookies.length === 0) {
      return NextResponse.json(
        { error: "No session found. Sign in again." },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ ok: true, rememberMe });
    const options = rememberMeCookieOptions(rememberMe);

    for (const { name, value } of authCookies) {
      response.cookies.set(name, value, options);
    }

    applyPersistPreferenceCookie(response, rememberMe);
    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not sync session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
