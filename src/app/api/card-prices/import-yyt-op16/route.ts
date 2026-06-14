import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { revalidateWorkspaceCardPrices } from "@/lib/cache-revalidate";
import { importYuyuTeiOp16Prices } from "@/lib/yuyu-tei-import";
import { isSchemaNotReadyError, SCHEMA_NOT_READY_MESSAGE } from "@/lib/safe-db";

export async function POST() {
  try {
    const { workspaceId } = await requireUser();
    const result = await importYuyuTeiOp16Prices(workspaceId);
    revalidateWorkspaceCardPrices(workspaceId);
    return NextResponse.json(result);
  } catch (e) {
    if (isSchemaNotReadyError(e)) {
      return NextResponse.json(
        { error: SCHEMA_NOT_READY_MESSAGE, schemaNotReady: true },
        { status: 503 }
      );
    }
    const message = e instanceof Error ? e.message : "Import failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
