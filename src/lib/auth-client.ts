import { persistRememberMePreference } from "@/lib/auth-remember";

function formatAuthError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (/failed to fetch|networkerror|load failed/i.test(err.message)) {
      return "Cannot reach the authentication server. Your Supabase project URL may be wrong or the project was deleted — check the yellow banner on this page, or update NEXT_PUBLIC_SUPABASE_URL in Vercel and .env.";
    }
    return err.message;
  }
  return fallback;
}

async function syncSessionCookies(rememberMe: boolean): Promise<boolean> {
  const res = await fetch("/api/auth/sync-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ rememberMe }),
  });
  return res.ok;
}

/** Sign in via same-origin API (avoids browser → Supabase CORS/network issues). */
export async function signInWithRememberMe(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, rememberMe }),
    });
  } catch (err) {
    throw new Error(formatAuthError(err, "Sign-in request failed. Is the dev server running?"));
  }

  const data = (await res.json().catch(() => ({}))) as { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Sign-in failed. Check your email and password.");
  }

  await syncSessionCookies(rememberMe);
  persistRememberMePreference(rememberMe, email);
}
