import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";
import {
  parseCookieHeader,
  rememberMeCookieOptions,
} from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(true),
});

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return { url, key };
}

function networkErrorMessage(e: unknown): string | null {
  const msg = e instanceof Error ? e.message : String(e);
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|unable to verify/i.test(msg)) {
    const host = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(not set)";
    return `Cannot reach Supabase at ${host}. The project may be paused, deleted, or the URL in Vercel/local .env is wrong. Open Supabase Dashboard → Project Settings → API and copy the current Project URL and anon key.`;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const env = getSupabaseEnv();
    if (!env) {
      return NextResponse.json(
        {
          error:
            "Server auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const { email, password, rememberMe } = parsed.data;
    let response = NextResponse.json({ ok: true, rememberMe });

    const supabase = createServerClient(env.url, env.key, {
      cookies: {
        getAll() {
          const header = request.headers.get("cookie");
          return header ? parseCookieHeader(header) : [];
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          const options = rememberMeCookieOptions(rememberMe);
          cookiesToSet.forEach(({ name, value }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json(
        {
          error:
            "Sign-in did not create a session. Confirm your email in Supabase, then try again.",
        },
        { status: 401 }
      );
    }

    return response;
  } catch (e) {
    const network = networkErrorMessage(e);
    const message = network ?? (e instanceof Error ? e.message : "Sign-in failed");
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
