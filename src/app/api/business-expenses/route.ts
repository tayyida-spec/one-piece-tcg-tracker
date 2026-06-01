import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { businessExpenseSchema } from "@/lib/validations";
import { revalidateWorkspaceExpenses } from "@/lib/cache-tags";
import { isSchemaNotReadyError, SCHEMA_NOT_READY_MESSAGE } from "@/lib/safe-db";

export async function GET() {
  try {
    const { workspaceId } = await requireUser();
    const expenses = await prisma.businessExpense.findMany({
      where: { workspaceId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(
      expenses.map((e) => ({
        ...e,
        amount: Number(e.amount),
        date: e.date.toISOString(),
      }))
    );
  } catch (e) {
    if (isSchemaNotReadyError(e)) {
      return NextResponse.json({ error: SCHEMA_NOT_READY_MESSAGE, schemaNotReady: true }, { status: 503 });
    }
    const message = e instanceof Error ? e.message : "Failed to load";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId, user } = await requireUser();
    const body = await request.json();
    const parsed = businessExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;
    const created = await prisma.businessExpense.create({
      data: {
        workspaceId,
        expenseCode: d.expenseCode?.trim() || null,
        category: d.category,
        itemName: d.itemName,
        vendor: d.vendor?.trim() || null,
        date: new Date(d.date),
        amount: d.amount,
        paymentMethod: d.paymentMethod?.trim() || null,
        recurring: d.recurring ?? false,
        frequency: d.frequency?.trim() || null,
        owner: d.owner?.trim() || null,
        reimbursement: d.reimbursement?.trim() || null,
        notes: d.notes?.trim() || null,
        createdBy: user.id,
      },
    });

    revalidateWorkspaceExpenses(workspaceId);
    return NextResponse.json({ ...created, amount: Number(created.amount) }, { status: 201 });
  } catch (e) {
    if (isSchemaNotReadyError(e)) {
      return NextResponse.json({ error: SCHEMA_NOT_READY_MESSAGE, schemaNotReady: true }, { status: 503 });
    }
    const message = e instanceof Error ? e.message : "Create failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
