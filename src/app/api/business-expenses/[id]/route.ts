import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { businessExpenseSchema } from "@/lib/validations";
import { revalidateWorkspaceExpenses } from "@/lib/cache-revalidate";
import { isSchemaNotReadyError, SCHEMA_NOT_READY_MESSAGE } from "@/lib/safe-db";
import { parseApiDate, toIsoDateString } from "@/lib/date-format";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = businessExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.businessExpense.findFirst({ where: { id, workspaceId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const d = parsed.data;
    const isoDate = toIsoDateString(d.date);
    if (!isoDate) {
      return NextResponse.json({ error: "Invalid date — use DD/MM/YYYY" }, { status: 400 });
    }
    const updated = await prisma.businessExpense.update({
      where: { id },
      data: {
        expenseCode: d.expenseCode?.trim() || null,
        category: d.category,
        itemName: d.itemName,
        vendor: d.vendor?.trim() || null,
        date: parseApiDate(isoDate),
        amount: d.amount,
        paymentMethod: d.paymentMethod?.trim() || null,
        recurring: d.recurring ?? false,
        frequency: d.frequency?.trim() || null,
        owner: d.owner?.trim() || null,
        reimbursement: d.reimbursement?.trim() || null,
        notes: d.notes?.trim() || null,
      },
    });

    revalidateWorkspaceExpenses(workspaceId);
    return NextResponse.json({ ...updated, amount: Number(updated.amount) });
  } catch (e) {
    if (isSchemaNotReadyError(e)) {
      return NextResponse.json({ error: SCHEMA_NOT_READY_MESSAGE, schemaNotReady: true }, { status: 503 });
    }
    const message = e instanceof Error ? e.message : "Update failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId } = await requireUser();
    const { id } = await params;

    const existing = await prisma.businessExpense.findFirst({ where: { id, workspaceId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.businessExpense.delete({ where: { id } });
    revalidateWorkspaceExpenses(workspaceId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isSchemaNotReadyError(e)) {
      return NextResponse.json({ error: SCHEMA_NOT_READY_MESSAGE, schemaNotReady: true }, { status: 503 });
    }
    const message = e instanceof Error ? e.message : "Delete failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
