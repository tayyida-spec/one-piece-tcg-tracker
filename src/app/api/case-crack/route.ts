import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { loadCrackableCases, crackCase } from "@/lib/case-crack-service";
import { caseCrackSchema } from "@/lib/validations";
import { revalidateWorkspaceDataTags } from "@/lib/cache-revalidate";

export async function GET() {
  try {
    const { workspaceId } = await requireUser();
    const cases = await loadCrackableCases(workspaceId);
    return NextResponse.json({ cases });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireUser();
    const body = await request.json();
    const parsed = caseCrackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await crackCase(workspaceId, parsed.data);
    revalidateWorkspaceDataTags(workspaceId);

    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Case crack failed";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
