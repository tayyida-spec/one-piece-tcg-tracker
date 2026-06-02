import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  applyPersistPreferenceCookie,
  copyResponseCookies,
  isSupabaseAuthCookie,
  readRememberMeFromRequest,
  rememberMeCookieOptions,
} from "@/lib/auth-cookies";
import { getUserFromRequestCookies } from "@/lib/supabase/middleware-session";
import { supabaseServerFetch } from "@/lib/supabase/server-fetch";

function isAuthRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/invite")
  );
}

function isPublicPath(pathname: string): boolean {
  return pathname === "/";
}

function isPublicApi(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth/") || pathname.startsWith("/api/setup-check")
  );
}

function redirectWithSessionCookies(
  request: NextRequest,
  pathname: string,
  sessionResponse: NextResponse,
  rememberMe: boolean
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const redirect = NextResponse.redirect(url);
  copyResponseCookies(sessionResponse, redirect, rememberMe);
  applyPersistPreferenceCookie(redirect, rememberMe);
  return redirect;
}

export async function updateSession(request: NextRequest) {
  const rememberMe = readRememberMeFromRequest(request);
  const pathname = request.nextUrl.pathname;

  let sessionResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user =
    url && key
      ? await refreshSessionUser(request, rememberMe, (response) => {
          sessionResponse = response;
        })
      : null;

  if (!user) {
    user = getUserFromRequestCookies(request);
  }

  if (!user && !isAuthRoute(pathname) && !isPublicPath(pathname) && !isPublicApi(pathname)) {
    return redirectWithSessionCookies(request, "/login", sessionResponse, rememberMe);
  }

  if (user && isAuthRoute(pathname)) {
    return redirectWithSessionCookies(request, "/dashboard", sessionResponse, rememberMe);
  }

  applyPersistPreferenceCookie(sessionResponse, rememberMe);
  return sessionResponse;
}

async function refreshSessionUser(
  request: NextRequest,
  rememberMe: boolean,
  setResponse: (response: NextResponse) => void
) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  let sessionResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    global: { fetch: supabaseServerFetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        sessionResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          const opts = isSupabaseAuthCookie(name)
            ? rememberMeCookieOptions(rememberMe)
            : options;
          sessionResponse.cookies.set(name, value, opts);
        });
        setResponse(sessionResponse);
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setResponse(sessionResponse);
    return user;
  } catch {
    setResponse(sessionResponse);
    return null;
  }
}
