import { NextResponse } from "next/server";
import { revalidateWorkspaceDataTags } from "@/lib/cache-revalidate";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transactionLineEditSchema } from "@/lib/validations";
import { ensureUniqueImportKey } from "@/lib/transaction-import-key";
import { resolveDisplayIdAsync } from "@/lib/transaction-code-data";
import { recalcInventoryPurchasePrice } from "@/lib/inventory-cost-sync";
import { parseApiDate, toIsoDateString } from "@/lib/date-format";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = transactionLineEditSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.transactionLine.findFirst({
      where: { id, transaction: { workspaceId } },
      include: { transaction: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = parsed.data;
    const isoDate = toIsoDateString(data.date);
    if (!isoDate) {
      return NextResponse.json({ error: "Invalid date — use DD/MM/YYYY" }, { status: 400 });
    }

    const itemType =
      data.itemType === "case" ? "sealed" : data.itemType === "card" ? "card" : data.itemType;

    const displayId = await resolveDisplayIdAsync(
      workspaceId,
      data.displayId,
      data.transactionType,
      itemType
    );

    const importKey = await ensureUniqueImportKey(
      workspaceId,
      displayId,
      isoDate,
      data.transactionType,
      prisma,
      existing.transactionId
    );

    const line = await prisma.transactionLine.update({
      where: { id },
      data: {
        itemType,
        cardName: data.cardName,
        cardId: data.cardId,
        series: data.series ?? "",
        rarity: data.rarity ?? "",
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        smartpacFee: data.smartpacFee ?? null,
        owner: data.owner ?? null,
        reimbursement: data.reimbursement ?? null,
        platform: data.platform ?? null,
        notes: data.notes ?? null,
        transaction: {
          update: {
            displayId,
            importKey,
            transactionType: data.transactionType,
            date: parseApiDate(isoDate),
          },
        },
      },
      include: { transaction: true },
    });

    if (existing.inventoryItemId) {
      await recalcInventoryPurchasePrice(existing.inventoryItemId);
    }

    revalidateWorkspaceDataTags(workspaceId);
    return NextResponse.json(line);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireUser();
    const { id } = await params;

    const existing = await prisma.transactionLine.findFirst({
      where: { id, transaction: { workspaceId } },
      include: { transaction: { include: { lines: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const inventoryItemId = existing.inventoryItemId;

    await prisma.transactionLine.delete({ where: { id } });

    if (existing.transaction.lines.length <= 1) {
      await prisma.transaction.delete({ where: { id: existing.transactionId } });
    }

    if (inventoryItemId) {
      await recalcInventoryPurchasePrice(inventoryItemId);
    }

    revalidateWorkspaceDataTags(workspaceId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
