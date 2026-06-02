"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import type { MemberRow } from "@/lib/members-data";

export function MembersClient({
  members: initialMembers,
  isAdmin,
}: {
  members: MemberRow[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(member: MemberRow) {
    setEditingId(member.id);
    setDisplayName(member.displayName ?? "");
    setRole(member.role);
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setError(null);
  }

  async function save(member: MemberRow) {
    setBusy(true);
    setError(null);
    const canEditRole = isAdmin && !member.isCurrentUser;
    const payload: { displayName?: string | null; role?: string } = {
      displayName: displayName.trim() || null,
    };
    if (canEditRole) payload.role = role;

    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Update failed");
        return;
      }
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? {
                ...m,
                displayName: data.displayName,
                role: data.role,
              }
            : m
        )
      );
      setEditingId(null);
      router.refresh();
    } catch {
      setError("Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="table-header-accent min-w-full text-sm">
          <thead>
            <tr className="bg-surface-elevated text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2">Display name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Joined</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member) => {
              const editing = editingId === member.id;
              const canEdit = member.isCurrentUser || isAdmin;
              const canEditRole = isAdmin && !member.isCurrentUser;

              return (
                <tr key={member.id}>
                  <td className="px-4 py-2">
                    {editing ? (
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="h-8 max-w-[200px]"
                      />
                    ) : (
                      <span className="font-medium text-foreground">
                        {member.displayName || "—"}
                        {member.isCurrentUser ? (
                          <span className="ml-2 text-xs text-brand">(you)</span>
                        ) : null}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted">{member.email ?? "—"}</td>
                  <td className="px-4 py-2">
                    {editing && canEditRole ? (
                      <Select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="h-8 max-w-[120px]"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </Select>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          member.role === "admin"
                            ? "bg-brand-dim text-brand"
                            : "bg-surface-elevated text-muted-foreground"
                        )}
                      >
                        {member.role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-muted">{formatDate(member.joinedAt)}</td>
                  <td className="px-4 py-2 text-right">
                    {canEdit ? (
                      editing ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => save(member)}
                            disabled={busy}
                          >
                            <Check className="h-4 w-4" aria-hidden />
                          </Button>
                          <Button type="button" variant="ghost" size="sm" onClick={cancel}>
                            <X className="h-4 w-4" aria-hidden />
                          </Button>
                        </div>
                      ) : (
                        <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(member)}>
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Button>
                      )
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isAdmin ? (
        <p className="text-xs text-muted">
          You can edit your own display name. Ask an admin to change roles.
        </p>
      ) : null}
    </div>
  );
}
