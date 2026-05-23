import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { getUserFromCookieList } from "@/lib/supabase/middleware-session";

/** Read the authenticated user from session cookies (no network call to Supabase). */
export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  return getUserFromCookieList(cookieStore.getAll());
}
