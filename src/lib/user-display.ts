import type { User } from "@supabase/supabase-js";

type MembershipLike = { displayName: string | null } | null | undefined;

export function resolveUserDisplayName(user: User, membership?: MembershipLike): string {
  if (membership?.displayName?.trim()) {
    return membership.displayName.trim();
  }
  const meta = user.user_metadata?.display_name;
  if (typeof meta === "string" && meta.trim()) {
    return meta.trim();
  }
  if (user.email) {
    return user.email.split("@")[0];
  }
  return "User";
}
