import { createClient } from "@/lib/supabase/client";
import { persistRememberMePreference } from "@/lib/auth-remember";

async function syncSessionCookies(rememberMe: boolean): Promise<void> {
  const res = await fetch("/api/auth/sync-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ rememberMe }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Could not finalize session");
  }
}

/** Browser sign-in (works on localhost/VPN) + server cookie sync for Remember me. */
export async function signInWithRememberMe(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    throw new Error(
      "Sign-in did not create a session. Confirm your email in Supabase, then try again."
    );
  }

  try {
    await syncSessionCookies(rememberMe);
  } catch {
    // Browser client already created a session; cookie duration may fall back to Supabase defaults.
  }

  persistRememberMePreference(rememberMe, email);
}
