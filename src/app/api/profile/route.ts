import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const { user, membership } = await requireUser();

    return NextResponse.json({
      email: user.email ?? "",
      displayName: membership.displayName,
      role: membership.role,
      workspaceName: membership.workspace.name,
      userId: user.id,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { membership } = await requireUser();
    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: membership.id },
      data: { displayName: parsed.data.displayName },
      include: { workspace: true },
    });

    const supabase = await createClient();
    await supabase.auth.updateUser({
      data: { display_name: parsed.data.displayName ?? "" },
    });

    return NextResponse.json({
      displayName: updated.displayName,
      role: updated.role,
      workspaceName: updated.workspace.name,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
