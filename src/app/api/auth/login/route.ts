import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { REMEMBER_ME_MAX_AGE_SEC } from "@/lib/auth-remember";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(true),
});

function applyRememberMeToCookieOptions(
  options: CookieOptions,
  rememberMe: boolean
): CookieOptions {
  const base: CookieOptions = {
    ...options,
    path: options.path ?? "/",
    sameSite: options.sameSite ?? "lax",
  };

  if (rememberMe) {
    return { ...base, maxAge: REMEMBER_ME_MAX_AGE_SEC };
  }

  const { maxAge: _maxAge, expires: _expires, ...sessionOnly } = base;
  return sessionOnly;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    const { email, password, rememberMe } = parsed.data;
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(
                name,
                value,
                applyRememberMeToCookieOptions(options, rememberMe)
              );
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.session) {
      return NextResponse.json(
        { error: "Sign-in did not create a session. Confirm your email in Supabase, then try again." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, rememberMe });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sign-in failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
