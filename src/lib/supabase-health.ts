export type SupabaseHealth = {
  ok: boolean;
  url: string | null;
  projectRef: string | null;
  message: string;
};

/** Server-side check that Supabase is reachable (used on login page). */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return {
      ok: false,
      url: url ?? null,
      projectRef: null,
      message: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  let projectRef: string | null = null;
  try {
    projectRef = new URL(url).hostname.split(".")[0];
  } catch {
    return {
      ok: false,
      url,
      projectRef: null,
      message: "NEXT_PUBLIC_SUPABASE_URL is not a valid URL.",
    };
  }

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return {
        ok: false,
        url,
        projectRef,
        message: `Supabase returned HTTP ${res.status}. Check the project is active in the dashboard.`,
      };
    }
    return {
      ok: true,
      url,
      projectRef,
      message: "Supabase is reachable.",
    };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      url,
      projectRef,
      message: `Cannot reach Supabase (${detail}). Project "${projectRef}" may be deleted, paused, or the URL in .env / Vercel is outdated. Open supabase.com/dashboard → your project → Settings → API and update all env vars.`,
    };
  }
}
