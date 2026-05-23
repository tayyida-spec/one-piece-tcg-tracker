import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-brand/10 ring-1 ring-brand/20">
      <h1 className="font-display text-xl font-semibold tracking-wide text-foreground">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Three Hats — One Piece TCG tracker</p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="font-medium text-brand underline hover:text-brand-hover">
          Sign up
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted">
        Have an invite?{" "}
        <Link href="/join" className="font-medium text-brand underline hover:text-brand-hover">
          Join workspace
        </Link>
      </p>
    </div>
  );
}
