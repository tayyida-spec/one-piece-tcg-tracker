"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  email: string;
  displayName: string;
  role: string;
  workspaceName: string;
};

export function ProfileForm({ email, displayName: initialName, role, workspaceName }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialName);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });

    setSavingProfile(false);

    if (!res.ok) {
      const data = await res.json();
      setProfileError(typeof data.error === "string" ? data.error : "Could not save profile");
      return;
    }

    setProfileSuccess("Profile updated.");
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setPasswordSuccess("Password updated.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-surface p-6">
        <h3 className="font-display text-lg font-semibold text-foreground">Account</h3>
        <p className="mt-1 text-sm text-muted">
          Workspace: <span className="text-foreground">{workspaceName}</span> · Role:{" "}
          <span className="capitalize text-foreground">{role}</span>
        </p>

        <form onSubmit={saveProfile} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="opacity-70" />
            <p className="text-xs text-muted-foreground">Email is managed by your login and cannot be changed here.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How your name appears in the app"
              maxLength={80}
            />
          </div>
          {profileError ? <p className="text-sm text-danger">{profileError}</p> : null}
          {profileSuccess ? <p className="text-sm text-success">{profileSuccess}</p> : null}
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h3 className="font-display text-lg font-semibold text-foreground">Change password</h3>
        <p className="mt-1 text-sm text-muted">
          Choose a new password for this account. You will stay signed in.
        </p>

        <form onSubmit={changePassword} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {passwordError ? <p className="text-sm text-danger">{passwordError}</p> : null}
          {passwordSuccess ? <p className="text-sm text-success">{passwordSuccess}</p> : null}
          <Button type="submit" variant="outline" disabled={savingPassword}>
            {savingPassword ? "Updating…" : "Update password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
