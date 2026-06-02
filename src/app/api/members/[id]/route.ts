import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { memberUpdateSchema } from "@/lib/validations";

import { createClient } from "@/lib/supabase/server";



export async function PATCH(

  request: Request,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const { workspaceId, membership, user } = await requireUser();

    const { id } = await params;

    const body = await request.json();

    const parsed = memberUpdateSchema.safeParse(body);



    if (!parsed.success) {

      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    }



    const target = await prisma.workspaceMember.findFirst({

      where: { id, workspaceId },

    });

    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });



    const isSelf = target.userId === user.id;

    const isAdmin = membership.role === "admin";



    if (!isSelf && !isAdmin) {

      return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    }



    if (parsed.data.role !== undefined && !isAdmin) {

      return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });

    }



    if (parsed.data.role === "member" && target.role === "admin") {

      const adminCount = await prisma.workspaceMember.count({

        where: { workspaceId, role: "admin" },

      });

      if (adminCount <= 1) {

        return NextResponse.json({ error: "Cannot demote the last admin" }, { status: 400 });

      }

    }



    const updated = await prisma.workspaceMember.update({

      where: { id },

      data: {

        ...(parsed.data.displayName !== undefined ? { displayName: parsed.data.displayName } : {}),

        ...(parsed.data.role !== undefined ? { role: parsed.data.role } : {}),

      },

    });



    if (isSelf && parsed.data.displayName !== undefined) {

      const supabase = await createClient();

      await supabase.auth.updateUser({

        data: { display_name: parsed.data.displayName ?? "" },

      });

    }



    return NextResponse.json({

      id: updated.id,

      userId: updated.userId,

      displayName: updated.displayName,

      role: updated.role,

      joinedAt: updated.createdAt.toISOString(),

      isCurrentUser: updated.userId === user.id,

    });

  } catch (e) {

    const message = e instanceof Error ? e.message : "Error";

    if (message === "Unauthorized") {

      return NextResponse.json({ error: message }, { status: 401 });

    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, membership, user } = await requireUser();
    if (membership.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const target = await prisma.workspaceMember.findFirst({
      where: { id, workspaceId },
    });
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (target.userId === user.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    if (target.role === "admin") {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: "admin" },
      });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the last admin" }, { status: 400 });
      }
    }

    await prisma.workspaceMember.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

