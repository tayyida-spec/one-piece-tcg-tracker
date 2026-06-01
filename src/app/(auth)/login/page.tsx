import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SupabaseStatusBanner } from "@/components/auth/supabase-status-banner";

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-brand/10 ring-1 ring-brand/20">
      <Suspense fallback={null}>
        <SupabaseStatusBanner />
      </Suspense>
      <h1 className="font-display text-xl font-semibold tracking-wide text-foreground">Sign in</h1>      <p className="mt-1 text-sm text-muted">Sign in with your account</p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        New to Three Hats? Ask your group admin for the invite link — registration is only available
        through that link.
      </p>
    </div>
  );
}
