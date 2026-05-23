import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getSupabaseAuthStorageKey,
  isSupabaseAuthCookie,
  parseCookieHeader,
  rememberMeCookieOptions,
} from "@/lib/auth-cookies";

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
    const header = request.headers.get("cookie") ?? "";
    const cookies = parseCookieHeader(header);
    const authCookies = cookies.filter(({ name }) => isSupabaseAuthCookie(name, storageKey));

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

    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not sync session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
