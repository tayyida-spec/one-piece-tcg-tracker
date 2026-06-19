import { NextResponse } from "next/server";
import { revalidateWorkspaceDataTags } from "@/lib/cache-revalidate";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inventoryItemSchema } from "@/lib/validations";
import { normalizeIdentity } from "@/lib/inventory-identity";
import { marketPriceUpdateFields } from "@/lib/inventory-market-price";
import { createTransaction } from "@/lib/transaction-service";
import { toIsoDateString, todayDisplayDate } from "@/lib/date-format";
import { z } from "zod";

const inventoryCreateSchema = inventoryItemSchema.extend({
  logTxnBuy: z.coerce.boolean().optional(),
  purchaseDate: z.string().optional(),
  txnUnitPrice: z.coerce.number().optional(),
  displayId: z.string().optional(),
});
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
    const { workspaceId, user } = await requireUser();
    const body = await request.json();
    const parsed = inventoryCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    if (data.itemType === "sealed" && data.logTxnBuy && data.quantity > 0) {
      const isoDate =
        toIsoDateString(data.purchaseDate ?? todayDisplayDate()) ??
        new Date().toISOString().slice(0, 10);

      await createTransaction(workspaceId, user.id, {
        transactionType: "buy",
        date: isoDate,
        displayId: data.displayId?.trim() || undefined,
        batchLabel: null,
        smartpacFee: null,
        notes: data.notes ?? null,
        lines: [
          {
            itemType: "sealed",
            cardName: data.cardName,
            cardId: data.cardId,
            series: data.series ?? "",
            rarity: data.rarity ?? "",
            language: data.language ?? "JP",
            variant: data.variant ?? "",
            quantity: data.quantity,
            unitPrice: data.txnUnitPrice ?? data.purchasePrice ?? 0,
            owner: data.owner ?? null,
            notes: data.notes ?? null,
          },
        ],
      });

      const identity = normalizeIdentity({
        itemType: "sealed",
        cardId: data.cardId,
        series: data.series,
        rarity: data.rarity,
        variant: data.variant,
        language: data.language,
      });
      const item = await prisma.inventoryItem.findUnique({
        where: {
          workspaceId_itemType_cardId_series_rarity_variant_language: {
            workspaceId,
            ...identity,
          },
        },
      });

      revalidateWorkspaceDataTags(workspaceId);
      return NextResponse.json(item, { status: 201 });
    }

    const identity = normalizeIdentity({
      itemType: data.itemType,
      cardId: data.cardId,
      series: data.series,
      rarity: data.rarity,
      variant: data.variant,
      language: data.language,
    });

    const whereUnique = {
      workspaceId_itemType_cardId_series_rarity_variant_language: {
        workspaceId,
        ...identity,
      },
    };

    const existing = await prisma.inventoryItem.findUnique({ where: whereUnique });
    const priceFields = marketPriceUpdateFields(
      existing?.currentMarketPrice != null ? Number(existing.currentMarketPrice) : null,
      data.currentMarketPrice ?? null
    );

    const item = await prisma.inventoryItem.upsert({
      where: whereUnique,
      create: {
        workspaceId,
        ...identity,
        cardName: data.cardName,
        condition: data.condition ?? null,
        quantity: data.quantity,
        location: data.location ?? null,
        purchasePrice: data.purchasePrice ?? null,
        currentMarketPrice: data.currentMarketPrice ?? null,
        ...priceFields,
        owner: data.owner ?? null,
        notes: data.notes ?? null,
        photoUrl: data.photoUrl || null,
        status:
          data.quantity > 0
            ? existing?.status === "cracked"
              ? "cracked"
              : "in_stock"
            : (data.status ?? "sold_out"),
      },
      update: {
        cardName: data.cardName,
        condition: data.condition ?? null,
        quantity: data.quantity,
        location: data.location ?? null,
        purchasePrice: data.purchasePrice ?? null,
        currentMarketPrice: data.currentMarketPrice ?? null,
        ...priceFields,
        owner: data.owner ?? null,
        notes: data.notes ?? null,
        photoUrl: data.photoUrl || null,
        status:
          data.quantity > 0
            ? existing?.status === "cracked"
              ? "cracked"
              : "in_stock"
            : (data.status ?? "sold_out"),
      },
    });

    revalidateWorkspaceDataTags(workspaceId);
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
