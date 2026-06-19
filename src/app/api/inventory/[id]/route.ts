import { NextResponse } from "next/server";
import { revalidateWorkspaceDataTags } from "@/lib/cache-revalidate";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inventoryItemSchema } from "@/lib/validations";
import { marketPriceUpdateFields } from "@/lib/inventory-market-price";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireUser();
    const { id } = await params;
    const item = await prisma.inventoryItem.findFirst({
      where: { id, workspaceId },
    });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = inventoryItemSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.inventoryItem.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = parsed.data;
    const qty = data.quantity ?? Number(existing.quantity);
    const priceFields =
      data.currentMarketPrice !== undefined
        ? marketPriceUpdateFields(existing.currentMarketPrice, data.currentMarketPrice)
        : {};

    const status =
      data.status ??
      (qty <= 0 ? "sold_out" : existing.status === "cracked" ? "cracked" : "in_stock");

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...data,
        ...priceFields,
        photoUrl: data.photoUrl === "" ? null : data.photoUrl,
        status,
      },
    });

    revalidateWorkspaceDataTags(workspaceId);
    return NextResponse.json(item);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
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
    const existing = await prisma.inventoryItem.findFirst({
      where: { id, workspaceId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.inventoryItem.delete({ where: { id } });
    revalidateWorkspaceDataTags(workspaceId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
