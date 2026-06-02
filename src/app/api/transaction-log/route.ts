import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  loadTransactionLogPage,
  loadTransactionLogMonths,
  TRANSACTION_LOG_PAGE_SIZE,
} from "@/lib/transactions-data";

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireUser();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? TRANSACTION_LOG_PAGE_SIZE);
    const offset = Number(searchParams.get("offset") ?? 0);
    const month = searchParams.get("month");
    const monthsOnly = searchParams.get("monthsOnly") === "1";

    if (monthsOnly) {
      const months = await loadTransactionLogMonths(workspaceId);
      return NextResponse.json({ months });
    }

    const page = await loadTransactionLogPage(workspaceId, {
      limit,
      offset,
      month: month || null,
    });

    return NextResponse.json(page);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
