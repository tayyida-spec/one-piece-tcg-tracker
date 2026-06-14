import { NextResponse } from "next/server";
import { revalidateWorkspaceDashboard } from "@/lib/cache-revalidate";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalcInventoryPurchasePrice } from "@/lib/inventory-cost-sync";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireUser();
    const { id } = await params;
    const transaction = await prisma.transaction.findFirst({
      where: { id, workspaceId },
      include: {
        lines: { include: { inventoryItem: true } },
      },
    });
    if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(transaction);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireUser();
    const { id } = await params;

    const transaction = await prisma.transaction.findFirst({
      where: { id, workspaceId },
      include: { lines: true },
    });
    if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const inventoryIds = [
      ...new Set(
        transaction.lines
          .map((line) => line.inventoryItemId)
          .filter((id): id is string => id != null)
      ),
    ];

    await prisma.$transaction(async (tx) => {
      for (const line of transaction.lines) {
        if (!line.inventoryItemId) continue;
        const reverse =
          transaction.transactionType === "buy"
            ? -Number(line.quantity)
            : transaction.transactionType === "sell" ||
                transaction.transactionType === "gift"
              ? Number(line.quantity)
              : 0;
        if (reverse !== 0) {
          const item = await tx.inventoryItem.findUniqueOrThrow({
            where: { id: line.inventoryItemId },
          });
          const nextQty = Number(item.quantity) + reverse;
          await tx.inventoryItem.update({
            where: { id: line.inventoryItemId },
            data: {
              quantity: nextQty,
              status: nextQty > 0 ? "in_stock" : "sold_out",
            },
          });
        }
      }
      await tx.transaction.delete({ where: { id } });
    });

    for (const inventoryItemId of inventoryIds) {
      await recalcInventoryPurchasePrice(inventoryItemId);
    }

    revalidateWorkspaceDashboard(workspaceId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
