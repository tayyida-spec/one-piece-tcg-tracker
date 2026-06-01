import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPrefsSchema } from "@/lib/validations";
import { isSchemaNotReadyError, SCHEMA_NOT_READY_MESSAGE } from "@/lib/safe-db";

export async function PATCH(request: Request) {
  try {
    const { membership } = await requireUser();
    const body = await request.json();
    const parsed = dashboardPrefsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    try {
      await prisma.workspaceMember.update({
        where: { id: membership.id },
        data: {
          dashboardPrefs: {
            hidden: parsed.data.hidden,
            order: parsed.data.order ?? undefined,
          },
        },
      });
    } catch (e) {
      if (isSchemaNotReadyError(e)) {
        return NextResponse.json({ error: SCHEMA_NOT_READY_MESSAGE, schemaNotReady: true }, { status: 503 });
      }
      throw e;
    }

    return NextResponse.json({
      ok: true,
      hidden: parsed.data.hidden,
      order: parsed.data.order,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
