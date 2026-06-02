import { NextResponse } from "next/server";

import { revalidateWorkspaceCapital } from "@/lib/cache-revalidate";

import { requireUser } from "@/lib/auth";

import { requireAdmin } from "@/lib/auth-admin";

import { prisma } from "@/lib/prisma";

import { capitalContributionSchema } from "@/lib/validations";

import { isSchemaNotReadyError, SCHEMA_NOT_READY_MESSAGE } from "@/lib/safe-db";



export async function PATCH(

  request: Request,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const { workspaceId, membership } = await requireUser();

    requireAdmin(membership.role);

    const { id } = await params;

    const body = await request.json();

    const parsed = capitalContributionSchema.safeParse(body);



    if (!parsed.success) {

      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    }



    const existing = await prisma.capitalContribution.findFirst({

      where: { id, workspaceId },

    });

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });



    const row = await prisma.capitalContribution.update({

      where: { id },

      data: {

        date: new Date(parsed.data.date),

        amount: parsed.data.amount,

        contributor: parsed.data.contributor ?? null,

        notes: parsed.data.notes ?? null,

      },

    });



    revalidateWorkspaceCapital(workspaceId);

    return NextResponse.json({

      id: row.id,

      date: row.date.toISOString(),

      amount: Number(row.amount),

      contributor: row.contributor,

      notes: row.notes,

      createdAt: row.createdAt.toISOString(),

    });

  } catch (e) {

    if (isSchemaNotReadyError(e)) {

      return NextResponse.json({ error: SCHEMA_NOT_READY_MESSAGE }, { status: 503 });

    }

    const message = e instanceof Error ? e.message : "Error";

    if (message === "Unauthorized" || message === "Admin access required") {

      return NextResponse.json({ error: message }, { status: message.includes("Admin") ? 403 : 401 });

    }

    return NextResponse.json({ error: message }, { status: 500 });

  }

}



export async function DELETE(

  _request: Request,

  { params }: { params: Promise<{ id: string }> }

) {

  try {

    const { workspaceId, membership } = await requireUser();

    requireAdmin(membership.role);

    const { id } = await params;



    const existing = await prisma.capitalContribution.findFirst({

      where: { id, workspaceId },

    });

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });



    await prisma.capitalContribution.delete({ where: { id } });

    revalidateWorkspaceCapital(workspaceId);

    return NextResponse.json({ ok: true });

  } catch (e) {

    if (isSchemaNotReadyError(e)) {

      return NextResponse.json({ error: SCHEMA_NOT_READY_MESSAGE }, { status: 503 });

    }

    const message = e instanceof Error ? e.message : "Error";

    if (message === "Unauthorized" || message === "Admin access required") {

      return NextResponse.json({ error: message }, { status: message.includes("Admin") ? 403 : 401 });

    }

    return NextResponse.json({ error: message }, { status: 500 });

  }

}

