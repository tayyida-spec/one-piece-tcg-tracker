import { Suspense } from "react";
import Link from "next/link";
import { JoinForm } from "@/components/auth/join-form";

export default function JoinPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-brand/10 ring-1 ring-brand/20">
      <h1 className="font-display text-xl font-semibold tracking-wide text-foreground">
        Join Three Hats
      </h1>
      <p className="mt-1 text-sm text-muted">
        Use the invite link your group shared. Create an account or sign in, then you&apos;ll join
        the shared workspace automatically.
      </p>
      <div className="mt-6">
        <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
          <JoinForm />
        </Suspense>
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Already joined?{" "}
        <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
          Sign in
        </Link>
      </p>
    </div>
  );
}
