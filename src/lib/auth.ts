import { getSessionUser } from "@/lib/supabase/session";
import { ensureWorkspaceForUser } from "@/lib/workspace";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    throw new AuthError();
  }

  const membership = await ensureWorkspaceForUser(
    user.id,
    user.user_metadata?.display_name ?? user.email?.split("@")[0]
  );

  return { user, membership, workspaceId: membership.workspaceId };
}
