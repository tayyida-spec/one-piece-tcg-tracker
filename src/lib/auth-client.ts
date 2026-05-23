import { createClient } from "@/lib/supabase/client";
import { persistRememberMePreference } from "@/lib/auth-remember";

async function syncSessionCookies(rememberMe: boolean): Promise<boolean> {
  const res = await fetch("/api/auth/sync-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ rememberMe }),
  });

  return res.ok;
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

  // Give the browser a moment to attach auth cookies before sync (esp. chunked cookies).
  let synced = await syncSessionCookies(rememberMe);
  if (!synced) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    synced = await syncSessionCookies(rememberMe);
  }

  if (!synced) {
    // Supabase browser client already set session cookies; Remember me duration may use defaults.
  }

  persistRememberMePreference(rememberMe, email);
}
