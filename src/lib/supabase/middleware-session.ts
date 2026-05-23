import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAuthStorageKey } from "@/lib/auth-cookies";

const BASE64_PREFIX = "base64-";
/** Same margin Supabase uses before treating access tokens as expired. */
const EXPIRY_MARGIN_MS = 90_000;

type CookieLike = { name: string; value: string };

type StoredSession = {
  expires_at?: number;
  user?: User;
};

function supabaseAuthStorageKey(): string {
  return getSupabaseAuthStorageKey();
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function readAuthSessionJson(cookies: CookieLike[], storageKey: string): string | null {
  const getValue = (name: string) => cookies.find((c) => c.name === name)?.value ?? null;

  let combined = getValue(storageKey);
  if (!combined) {
    const chunks: string[] = [];
    for (let i = 0; ; i += 1) {
      const chunk = getValue(`${storageKey}.${i}`);
      if (!chunk) {
        break;
      }
      chunks.push(chunk);
    }
    combined = chunks.length > 0 ? chunks.join("") : null;
  }

  if (!combined) {
    return null;
  }

  if (combined.startsWith(BASE64_PREFIX)) {
    return decodeBase64Url(combined.slice(BASE64_PREFIX.length));
  }

  return combined;
}

function readUserFromUserCookie(cookies: CookieLike[], storageKey: string): User | null {
  const raw = readAuthSessionJson(cookies, `${storageKey}-user`);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { user?: User };
    return parsed.user ?? null;
  } catch {
    return null;
  }
}

/** Cookie-only session read (no Supabase network / token refresh). */
export function getUserFromCookieList(cookies: CookieLike[]): User | null {
  const storageKey = supabaseAuthStorageKey();
  const raw = readAuthSessionJson(cookies, storageKey);
  if (!raw) {
    return readUserFromUserCookie(cookies, storageKey);
  }

  let session: StoredSession;
  try {
    session = JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }

  const user = session.user ?? readUserFromUserCookie(cookies, storageKey);
  if (!user) {
    return null;
  }

  const expiresAtMs = session.expires_at ? session.expires_at * 1000 : null;
  if (expiresAtMs !== null && expiresAtMs - Date.now() < EXPIRY_MARGIN_MS) {
    return null;
  }

  return user;
}

export function getUserFromRequestCookies(request: NextRequest): User | null {
  return getUserFromCookieList(request.cookies.getAll());
}
