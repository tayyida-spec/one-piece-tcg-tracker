import { NextResponse } from "next/server";
import { revalidateWorkspaceDashboard } from "@/lib/cache-tags";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quickAddTransactionSchema, transactionSchema } from "@/lib/validations";
import { createTransaction } from "@/lib/transaction-service";

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    const transactions = await prisma.transaction.findMany({
      where: {
        workspaceId,
        ...(q
          ? {
              OR: [
                { displayId: { contains: q, mode: "insensitive" } },
                { batchLabel: { contains: q, mode: "insensitive" } },
                { notes: { contains: q, mode: "insensitive" } },
                {
                  lines: {
                    some: {
                      OR: [
                        { cardName: { contains: q, mode: "insensitive" } },
                        { cardId: { contains: q, mode: "insensitive" } },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        lines: {
          include: { inventoryItem: true },
          orderBy: { cardName: "asc" },
        },
      },
      orderBy: { date: "desc" },
      take: 200,
    });

    return NextResponse.json(transactions);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId, user } = await requireUser();
    const body = await request.json();
    const parsed = (body?.quickAdd === true
      ? quickAddTransactionSchema
      : transactionSchema
    ).safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const transaction = await createTransaction(workspaceId, user.id, parsed.data);
    revalidateWorkspaceDashboard(workspaceId);
    return NextResponse.json(transaction, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
