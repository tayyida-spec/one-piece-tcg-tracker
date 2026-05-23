import { NextResponse } from "next/server";
import { revalidateWorkspaceDashboard } from "@/lib/cache-tags";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inventoryItemSchema } from "@/lib/validations";
import { normalizeIdentity } from "@/lib/inventory-identity";

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireUser();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");

    const items = await prisma.inventoryItem.findMany({
      where: {
        workspaceId,
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { cardName: { contains: q, mode: "insensitive" } },
                { cardId: { contains: q, mode: "insensitive" } },
                { series: { contains: q, mode: "insensitive" } },
                { rarity: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json(items);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireUser();
    const body = await request.json();
    const parsed = inventoryItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const identity = normalizeIdentity({
      itemType: data.itemType,
      cardId: data.cardId,
      series: data.series,
      rarity: data.rarity,
      variant: data.variant,
      language: data.language,
    });

    const item = await prisma.inventoryItem.upsert({
      where: {
        workspaceId_itemType_cardId_series_rarity_variant_language: {
          workspaceId,
          ...identity,
        },
      },
      create: {
        workspaceId,
        ...identity,
        cardName: data.cardName,
        condition: data.condition ?? null,
        quantity: data.quantity,
        location: data.location ?? null,
        purchasePrice: data.purchasePrice ?? null,
        currentMarketPrice: data.currentMarketPrice ?? null,
        owner: data.owner ?? null,
        notes: data.notes ?? null,
        photoUrl: data.photoUrl || null,
        status: data.quantity > 0 ? "in_stock" : (data.status ?? "sold_out"),
      },
      update: {
        cardName: data.cardName,
        condition: data.condition ?? null,
        quantity: data.quantity,
        location: data.location ?? null,
        purchasePrice: data.purchasePrice ?? null,
        currentMarketPrice: data.currentMarketPrice ?? null,
        owner: data.owner ?? null,
        notes: data.notes ?? null,
        photoUrl: data.photoUrl || null,
        status: data.quantity > 0 ? "in_stock" : (data.status ?? "sold_out"),
      },
    });

    revalidateWorkspaceDashboard(workspaceId);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
