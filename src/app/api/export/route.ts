import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildWorkbookBuffer } from "@/lib/excel-export";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { workspaceId } = await requireUser();
    const buffer = await buildWorkbookBuffer(workspaceId);
    const filename = `Three-Hats-export-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
