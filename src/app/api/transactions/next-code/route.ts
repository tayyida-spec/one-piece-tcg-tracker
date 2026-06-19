import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextCodeForPrefix } from "@/lib/transaction-codes";

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireUser();
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix")?.trim().toLowerCase();

    if (prefix !== "txn" && prefix !== "bc") {
      return NextResponse.json({ error: "prefix must be txn or bc" }, { status: 400 });
    }

    const existingIds = (
      await prisma.transaction.findMany({
        where: { workspaceId },
        select: { displayId: true },
      })
    ).map((t) => t.displayId);

    return NextResponse.json({ code: nextCodeForPrefix(prefix, existingIds) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
