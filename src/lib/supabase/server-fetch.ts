/**
 * Node fetch to Supabase on some Windows/corporate networks fails with
 * UNABLE_TO_VERIFY_LEAF_SIGNATURE while the browser still works.
 * In development, relax TLS verification for server-side Supabase calls only.
 */
const useInsecureTls =
  process.env.NODE_ENV === "development" || process.env.SUPABASE_INSECURE_TLS === "1";

if (useInsecureTls && process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export const supabaseServerFetch: typeof fetch = fetch;

export function isTlsCertificateError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  const code =
    e && typeof e === "object" && "cause" in e && e.cause && typeof e.cause === "object"
      ? String((e.cause as { code?: string }).code ?? "")
      : "";
  return (
    /unable to verify|UNABLE_TO_VERIFY|certificate|cert/i.test(msg) ||
    /UNABLE_TO_VERIFY/i.test(code)
  );
}
