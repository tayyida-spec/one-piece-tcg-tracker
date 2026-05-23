import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { AuthError, requireUser } from "@/lib/auth";
import { resolveUserDisplayName } from "@/lib/user-display";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let membership;
  let userName = "User";
  try {
    const auth = await requireUser();
    membership = auth.membership;
    userName = resolveUserDisplayName(auth.user, membership);
  } catch (e) {
    if (e instanceof AuthError) {
      redirect("/login");
    }

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
