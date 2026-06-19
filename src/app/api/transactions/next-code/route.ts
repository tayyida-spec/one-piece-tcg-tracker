import { NextResponse } from "next/server";
import { revalidateWorkspaceDataTags } from "@/lib/cache-revalidate";
import { requireUser } from "@/lib/auth";
import { nextCodeForPrefixAsync } from "@/lib/transaction-code-data";

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireUser();
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix")?.trim().toLowerCase();

    if (prefix !== "txn" && prefix !== "bc") {
      return NextResponse.json({ error: "prefix must be txn or bc" }, { status: 400 });
    }

    const code = await nextCodeForPrefixAsync(workspaceId, prefix);
    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
