import { checkSupabaseHealth } from "@/lib/supabase-health";

export async function SupabaseStatusBanner() {
  const health = await checkSupabaseHealth();
  if (health.ok) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
    >
      <p className="font-semibold text-amber-200">Authentication server unreachable</p>
      <p className="mt-1 text-amber-100/90">{health.message}</p>
      {health.projectRef ? (
        <p className="mt-2 text-xs text-amber-200/80">
          Configured project: <code className="text-amber-100">{health.projectRef}</code>
        </p>
      ) : null}
    </div>
  );
}
