import { NextResponse } from "next/server";

import { revalidateWorkspaceCapital } from "@/lib/cache-revalidate";

import { requireUser } from "@/lib/auth";

import { prisma } from "@/lib/prisma";

import { capitalContributionSchema } from "@/lib/validations";

import { getWorkspaceTotalCapital } from "@/lib/capital-data";

import { isSchemaNotReadyError, SCHEMA_NOT_READY_MESSAGE } from "@/lib/safe-db";



export async function GET() {

  try {

    const { workspaceId } = await requireUser();

    const [rows, totalCapital] = await Promise.all([

      prisma.capitalContribution.findMany({

        where: { workspaceId },

        orderBy: [{ date: "desc" }, { createdAt: "desc" }],

      }),

      getWorkspaceTotalCapital(workspaceId),

    ]);



    return NextResponse.json({

      totalCapital,

      rows: rows.map((r) => ({

        id: r.id,

        date: r.date.toISOString(),

        amount: Number(r.amount),

        contributor: r.contributor,

        notes: r.notes,

        createdAt: r.createdAt.toISOString(),

      })),

    });

  } catch (e) {

    if (isSchemaNotReadyError(e)) {

      return NextResponse.json({ totalCapital: 0, rows: [], schemaNotReady: true });

    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  }

}



export async function POST(request: Request) {

  try {

    const { workspaceId, user } = await requireUser();

    const body = await request.json();

    const parsed = capitalContributionSchema.safeParse(body);



    if (!parsed.success) {

      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    }



    const row = await prisma.capitalContribution.create({

      data: {

        workspaceId,

        date: new Date(parsed.data.date),

        amount: parsed.data.amount,

        contributor: parsed.data.contributor ?? null,

        notes: parsed.data.notes ?? null,

        createdBy: user.id,

      },

    });



    revalidateWorkspaceCapital(workspaceId);

    return NextResponse.json(

      {

        id: row.id,

        date: row.date.toISOString(),

        amount: Number(row.amount),

        contributor: row.contributor,

        notes: row.notes,

        createdAt: row.createdAt.toISOString(),

      },

      { status: 201 }

    );

  } catch (e) {

    if (isSchemaNotReadyError(e)) {

      return NextResponse.json({ error: SCHEMA_NOT_READY_MESSAGE }, { status: 503 });

    }

    const message = e instanceof Error ? e.message : "Error";

    if (message === "Unauthorized") {

      return NextResponse.json({ error: message }, { status: 401 });

    }

    return NextResponse.json({ error: message }, { status: 500 });

  }

}

