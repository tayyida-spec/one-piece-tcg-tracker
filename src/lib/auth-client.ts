import { persistRememberMePreference } from "@/lib/auth-remember";

export async function signInViaApi(
  email: string,
  password: string,
  rememberMe: boolean
): Promise<void> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, rememberMe }),
  });

  const data = (await res.json().catch(() => ({}))) as { error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Sign-in failed");
  }

  persistRememberMePreference(rememberMe, email);
}
