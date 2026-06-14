import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";

import { loadWorkspaceMembers } from "@/lib/members-data";



export async function GET() {

  try {

    const { workspaceId, user } = await requireUser();

    const members = await loadWorkspaceMembers(workspaceId, user.id);

    return NextResponse.json({ members });

  } catch {

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  }

}

