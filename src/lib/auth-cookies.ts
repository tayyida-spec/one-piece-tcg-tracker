import type { CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { REMEMBER_ME_MAX_AGE_SEC } from "@/lib/auth-remember";

/** Server-readable flag so middleware can refresh auth with the right cookie lifetime. */
export const AUTH_PERSIST_COOKIE = "three-hats-auth-persist";

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

function baseCookieOptions(): CookieOptions {
  return {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  };
}

export function rememberMeCookieOptions(rememberMe: boolean): CookieOptions {
  const base = baseCookieOptions();
  if (rememberMe) {
    return { ...base, maxAge: REMEMBER_ME_MAX_AGE_SEC };
  }
  return base;
}

/** Stores remember-me choice for middleware token refresh (30 days or session-only). */
export function persistPreferenceCookieOptions(rememberMe: boolean): CookieOptions {
  const base: CookieOptions = {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  if (rememberMe) {
    return { ...base, maxAge: REMEMBER_ME_MAX_AGE_SEC };
  }
  return { ...base, maxAge: 0 };
}

export function readRememberMeFromRequest(request: NextRequest): boolean {
  const value = request.cookies.get(AUTH_PERSIST_COOKIE)?.value;
  if (value === "1") return true;
  if (value === "0") return false;
  return true;
}

export function applyPersistPreferenceCookie(
  response: NextResponse,
  rememberMe: boolean
): void {
  response.cookies.set(
    AUTH_PERSIST_COOKIE,
    rememberMe ? "1" : "0",
    persistPreferenceCookieOptions(rememberMe)
  );
}

export function copyResponseCookies(
  from: NextResponse,
  to: NextResponse,
  rememberMe?: boolean
): void {
  from.cookies.getAll().forEach((cookie) => {
    if (rememberMe !== undefined && isSupabaseAuthCookie(cookie.name)) {
      to.cookies.set(cookie.name, cookie.value, rememberMeCookieOptions(rememberMe));
    } else {
      to.cookies.set(cookie.name, cookie.value);
    }
  });
}
