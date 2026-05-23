import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-brand/10 ring-1 ring-brand/20">
      <h1 className="font-display text-xl font-semibold tracking-wide text-foreground">
        Create account
      </h1>
      <p className="mt-1 text-sm text-muted">
        First member creates the shared Three Hats workspace.
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand underline hover:text-brand-hover">
          Sign in
        </Link>
      </p>
    </div>
  );
}
