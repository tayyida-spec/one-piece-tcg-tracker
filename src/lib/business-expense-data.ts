import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { expensesCacheTag } from "@/lib/cache-tags";
import { isSchemaNotReadyError } from "@/lib/safe-db";

export type BusinessExpenseRow = {
  id: string;
  expenseCode: string | null;
  category: string;
  itemName: string;
  vendor: string | null;
  date: string;
  amount: number;
  paymentMethod: string | null;
  recurring: boolean;
  frequency: string | null;
  owner: string | null;
  reimbursement: string | null;
  notes: string | null;
};

async function loadBusinessExpenses(workspaceId: string): Promise<BusinessExpenseRow[]> {
  let rows;
  try {
    rows = await prisma.businessExpense.findMany({
      where: { workspaceId },
      orderBy: { date: "desc" },
    });
  } catch (e) {
    if (isSchemaNotReadyError(e)) return [];
    throw e;
  }
  return rows.map((e) => ({
    id: e.id,
    expenseCode: e.expenseCode,
    category: e.category,
    itemName: e.itemName,
    vendor: e.vendor,
    date: e.date.toISOString(),
    amount: Number(e.amount),
    paymentMethod: e.paymentMethod,
    recurring: e.recurring,
    frequency: e.frequency,
    owner: e.owner,
    reimbursement: e.reimbursement,
    notes: e.notes,
  }));
}

export function getCachedBusinessExpenses(workspaceId: string) {
  return unstable_cache(
    () => loadBusinessExpenses(workspaceId),
    [expensesCacheTag(workspaceId)],
    { revalidate: 120, tags: [expensesCacheTag(workspaceId)] }
  )();
}
