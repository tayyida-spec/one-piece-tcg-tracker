import Link from "next/link";
import { JoinForm } from "@/components/auth/join-form";

export default function JoinPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-brand/10 ring-1 ring-brand/20">
      <h1 className="font-display text-xl font-semibold tracking-wide text-foreground">
        Join Three Hats
      </h1>
      <p className="mt-1 text-sm text-muted">
        Enter the invite code your group shared (default in README).
      </p>
      <div className="mt-6">
        <JoinForm />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
