import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPrefsSchema } from "@/lib/validations";

export async function PATCH(request: Request) {
  try {
    const { membership } = await requireUser();
    const body = await request.json();
    const parsed = dashboardPrefsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await prisma.workspaceMember.update({
      where: { id: membership.id },
      data: { dashboardPrefs: { hidden: parsed.data.hidden } },
    });

    return NextResponse.json({ ok: true, hidden: parsed.data.hidden });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
