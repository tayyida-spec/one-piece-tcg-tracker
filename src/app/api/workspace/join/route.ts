import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/session";
import { joinWorkspaceByInviteCode } from "@/lib/workspace";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const body = await request.json();
  const inviteCode = String(body.inviteCode ?? "").trim();

  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code required" }, { status: 400 });
  }

  try {
    const membership = await joinWorkspaceByInviteCode(user.id, inviteCode);
    return NextResponse.json(membership);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Join failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
