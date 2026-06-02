import { createClient } from "@/lib/supabase/client";
import { persistRememberMePreference } from "@/lib/auth-remember";

function formatAuthError(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (/failed to fetch|networkerror|load failed/i.test(err.message)) {
      return "Network error talking to the app or Supabase. If you are on a corporate VPN, try disabling it or use a personal hotspot. On localhost, restart with: npm run dev";
    }
    return err.message;
  }
  return fallback;
}

function isNetworkFailure(err: unknown): boolean {
  return (
    err instanceof TypeError &&
    /failed to fetch|networkerror|load failed/i.test(err.message)
  );
}

async function syncSessionCookies(rememberMe: boolean): Promise<void> {
  const res = await fetch("/api/auth/sync-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ rememberMe }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Could not save stay-signed-in preference. Try signing in again.");
  }
}

/** Browser → Supabase (works when Node TLS is blocked on localhost). */
async function signInViaBrowser(
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

  await syncSessionCookies(rememberMe);
  persistRememberMePreference(rememberMe, email);
}

/** Sign in: server API first, browser fallback if server cannot reach Supabase (local TLS/VPN). */
export async function signInWithRememberMe(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<void> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };

    if (res.ok) {
      await syncSessionCookies(rememberMe);
      persistRememberMePreference(rememberMe, email);
      return;
    }

    const serverUnreachable =
      res.status === 503 &&
      /cannot reach supabase|unable to verify|certificate/i.test(data.error ?? "");

    if (serverUnreachable) {
      await signInViaBrowser(email, password, rememberMe);
      return;
    }

    throw new Error(data.error ?? "Sign-in failed. Check your email and password.");
  } catch (err) {
    if (isNetworkFailure(err)) {
      try {
        await signInViaBrowser(email, password, rememberMe);
        return;
      } catch (browserErr) {
        throw new Error(formatAuthError(browserErr, "Sign-in failed"));
      }
    }
    throw new Error(formatAuthError(err, "Sign-in request failed. Is the dev server running?"));
  }
}
