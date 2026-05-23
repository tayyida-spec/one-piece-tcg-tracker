"use client";

import { useEffect, useState } from "react";
import { signInWithRememberMe } from "@/lib/auth-client";
import { loadRememberMePreference } from "@/lib/auth-remember";
import { RememberMeField } from "@/components/auth/remember-me-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SIGN_IN_TIMEOUT_MS = 20_000;

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

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pref = loadRememberMePreference();
    setRememberMe(pref.rememberMe);
    if (pref.email) {
      setEmail(pref.email);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await withTimeout(
        signInWithRememberMe(email, password, rememberMe),
        SIGN_IN_TIMEOUT_MS,
        "Sign-in timed out. Your network may be blocking Supabase — try another connection or disable VPN."
      );

      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete={rememberMe ? "current-password" : "off"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <RememberMeField checked={rememberMe} onChange={setRememberMe} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
