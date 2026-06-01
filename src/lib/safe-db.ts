import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SCHEMA_NOT_READY_MESSAGE =
  "Database update required. Run npm run db:bootstrap locally, or paste prisma/manual-migrations/*.sql into Supabase SQL Editor.";

/** Prisma errors when a table/column from the schema is not in the database yet. */
export function isSchemaNotReadyError(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    return e.code === "P2021" || e.code === "P2022";
  }
  const msg = e instanceof Error ? e.message : String(e);
  return /does not exist|column.*not found|relation.*does not exist/i.test(msg);
}

/** Membership fields that exist before the dashboardPrefs migration. */
export const workspaceMemberSelect = {
  id: true,
  workspaceId: true,
  userId: true,
  role: true,
  displayName: true,
  createdAt: true,
  workspace: true,
} as const;

export async function getMemberDashboardPrefs(memberId: string): Promise<unknown> {
  try {
    const row = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      select: { dashboardPrefs: true },
    });
    return row?.dashboardPrefs ?? null;
  } catch (e) {
    if (isSchemaNotReadyError(e)) return null;
    throw e;
  }
}

export type ExpenseRowLite = { amount: unknown; category: string };

export async function loadExpensesSafe(workspaceId: string): Promise<ExpenseRowLite[]> {
  try {
    return await prisma.businessExpense.findMany({
      where: { workspaceId },
      select: { amount: true, category: true },
    });
  } catch (e) {
    if (isSchemaNotReadyError(e)) return [];
    throw e;
  }
}
