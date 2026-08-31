import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { isAuthError, requireUser } from "@/lib/auth";
import { resolveUserDisplayName } from "@/lib/user-display";

export const dynamic = "force-dynamic";

function isNextRedirectError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as { digest: string }).digest === "string" &&
    (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let membership;
  let userName = "User";
  try {
    const auth = await requireUser();
    membership = auth.membership;
    userName = resolveUserDisplayName(auth.user, membership);
  } catch (e) {
    if (isNextRedirectError(e)) {
      throw e;
    }
    if (isAuthError(e)) {
      redirect("/login");
    }

    const message = e instanceof Error ? e.message : String(e);
    console.error("[app-layout] requireUser failed:", message);

    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md rounded-xl border border-danger/40 bg-surface p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">Database connection error</h1>
          <p className="mt-2 text-sm text-muted">
            You are signed in, but the app cannot reach the database. Update{" "}
            <code className="text-xs">DATABASE_URL</code> and{" "}
            <code className="text-xs">DIRECT_URL</code> in <code className="text-xs">.env</code>{" "}
            with the password from Supabase → Project Settings → Database.
          </p>
          <p className="mt-3 text-xs text-muted">
            If you see &quot;too many authentication failures&quot;, wait a few minutes for
            Supabase to unblock connections, then restart the dev server.
          </p>
          {process.env.NODE_ENV === "development" ? (
            <p className="mt-3 rounded-md bg-muted/20 p-2 font-mono text-xs text-danger break-all">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav workspaceName={membership.workspace.name} userName={userName} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
