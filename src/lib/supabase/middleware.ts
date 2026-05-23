import { NextResponse, type NextRequest } from "next/server";
import { getUserFromRequestCookies } from "@/lib/supabase/middleware-session";

export async function updateSession(request: NextRequest) {
  const user = getUserFromRequestCookies(request);

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/join") ||
    request.nextUrl.pathname.startsWith("/invite");

  const isPublic = request.nextUrl.pathname === "/";
  const isAuthApi = request.nextUrl.pathname.startsWith("/api/auth/");

  if (!user && !isAuthRoute && !isPublic && !isAuthApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
