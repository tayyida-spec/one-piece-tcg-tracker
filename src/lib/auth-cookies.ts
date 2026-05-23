import type { CookieOptions } from "@supabase/ssr";
import { REMEMBER_ME_MAX_AGE_SEC } from "@/lib/auth-remember";

export function getSupabaseAuthStorageKey(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    return "sb-auth-token";
  }
  const projectRef = new URL(url).hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

export function isSupabaseAuthCookie(name: string, storageKey = getSupabaseAuthStorageKey()): boolean {
  return (
    name === storageKey ||
    name.startsWith(`${storageKey}.`) ||
    name === `${storageKey}-user`
  );
}

export function parseCookieHeader(header: string): { name: string; value: string }[] {
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

export function rememberMeCookieOptions(rememberMe: boolean): CookieOptions {
  const base: CookieOptions = {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  };

  if (rememberMe) {
    return { ...base, maxAge: REMEMBER_ME_MAX_AGE_SEC };
  }

  return base;
}
