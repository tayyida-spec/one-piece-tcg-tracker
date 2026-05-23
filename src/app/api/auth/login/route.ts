import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";
import { REMEMBER_ME_MAX_AGE_SEC } from "@/lib/auth-remember";

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

function applyRememberMeToCookieOptions(
  options: CookieOptions,
  rememberMe: boolean
): CookieOptions {
  const base: CookieOptions = {
    ...options,
    path: options.path ?? "/",
    sameSite: options.sameSite ?? "lax",
    secure: process.env.NODE_ENV === "production",
  };

  if (rememberMe) {
    return { ...base, maxAge: REMEMBER_ME_MAX_AGE_SEC };
  }

  const { maxAge: _maxAge, expires: _expires, ...sessionOnly } = base;
  return sessionOnly;
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
          return request.headers.get("cookie")
            ? parseCookieHeader(request.headers.get("cookie")!)
            : [];
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(
              name,
              value,
              applyRememberMeToCookieOptions(options, rememberMe)
            );
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
    const message = e instanceof Error ? e.message : "Sign-in failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Minimal cookie parser for the login request (avoids next/headers cookie race). */
function parseCookieHeader(header: string): { name: string; value: string }[] {
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const eq = part.indexOf("=");
      if (eq === -1) return { name: part, value: "" };
      return {
        name: part.slice(0, eq).trim(),
        value: part.slice(eq + 1).trim(),
      };
    });
}
