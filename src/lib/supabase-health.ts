import { isTlsCertificateError, supabaseServerFetch } from "@/lib/supabase/server-fetch";

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
    const res = await supabaseServerFetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    // Any HTTP response means the host is reachable (401 without key is fine).
    if (res.status >= 500) {
      return {
        ok: false,
        url,
        projectRef,
        message: `Supabase returned HTTP ${res.status}. The project may still be starting up — try again shortly.`,
      };
    }
    return {
      ok: true,
      url,
      projectRef,
      message: "Supabase is reachable.",
    };
  } catch (e) {
    if (isTlsCertificateError(e)) {
      return {
        ok: false,
        url,
        projectRef,
        message:
          "Node cannot verify Supabase TLS on this network (corporate VPN/proxy). Sign-in will use your browser instead — or set SUPABASE_INSECURE_TLS=1 in .env and restart npm run dev.",
      };
    }
    const detail = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      url,
      projectRef,
      message: `Cannot reach Supabase (${detail}). Confirm the project is active at supabase.com/dashboard and env vars match Settings → API.`,
    };
  }
}
