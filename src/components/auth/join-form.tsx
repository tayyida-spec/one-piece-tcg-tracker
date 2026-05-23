"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const AUTH_TIMEOUT_MS = 20_000;

type Tab = "create" | "signin";

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code")?.trim() ?? "";

  const [tab, setTab] = useState<Tab>("create");
  const [inviteCode, setInviteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (codeFromUrl) {
      setInviteCode(codeFromUrl);
    }
  }, [codeFromUrl]);

  async function joinWorkspace(code: string) {
    const res = await fetch("/api/workspace/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Could not join workspace");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const code = inviteCode.trim();
    if (!code) {
      setError("Invite code required");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
          },
        }),
        AUTH_TIMEOUT_MS,
        "Sign-up timed out. Your network may be blocking Supabase — try another connection or disable VPN."
      );

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("Check your email to confirm your account, then sign in below with the same invite link.");
        setTab("signin");
        setLoading(false);
        return;
      }

      await joinWorkspace(code);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
      setLoading(false);
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const code = inviteCode.trim();
    if (!code) {
      setError("Invite code required");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        AUTH_TIMEOUT_MS,
        "Sign-in timed out. Your network may be blocking Supabase — try another connection or disable VPN."
      );

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError("Sign-in did not create a session. Confirm your email in Supabase, then try again.");
        setLoading(false);
        return;
      }

      await joinWorkspace(code);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
      setLoading(false);
    }
  }

  const inviteLocked = Boolean(codeFromUrl);

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-border bg-surface-elevated p-1">
        <button
          type="button"
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "create"
              ? "bg-brand text-white shadow-sm"
              : "text-muted hover:text-foreground"
          )}
          onClick={() => {
            setTab("create");
            setError(null);
          }}
        >
          New here
        </button>
        <button
          type="button"
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            tab === "signin"
              ? "bg-brand text-white shadow-sm"
              : "text-muted hover:text-foreground"
          )}
          onClick={() => {
            setTab("signin");
            setError(null);
          }}
        >
          Returning
        </button>
      </div>

      {tab === "create" ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name (optional)</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-password">Password</Label>
            <Input
              id="create-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <InviteCodeField
            id="create-inviteCode"
            value={inviteCode}
            onChange={setInviteCode}
            readOnly={inviteLocked}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account & join"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <InviteCodeField
            id="signin-inviteCode"
            value={inviteCode}
            onChange={setInviteCode}
            readOnly={inviteLocked}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in & join"}
          </Button>
        </form>
      )}
    </div>
  );
}

function InviteCodeField({
  id,
  value,
  onChange,
  readOnly,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  readOnly: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Invite code</Label>
      <Input
        id={id}
        required
        placeholder="three-hats-2026"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={readOnly ? "bg-surface-elevated text-muted" : undefined}
      />
      {readOnly ? (
        <p className="text-xs text-muted">Pre-filled from your invite link.</p>
      ) : null}
    </div>
  );
}
