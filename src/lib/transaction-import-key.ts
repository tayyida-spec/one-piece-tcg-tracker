import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toIsoDateString } from "@/lib/date-format";

type DbClient = Prisma.TransactionClient | typeof prisma;

export function buildTransactionImportKey(
  displayId: string,
  date: Date | string,
  transactionType: string
) {
  const iso =
    typeof date === "string" ? toIsoDateString(date) : toIsoDateString(date.toISOString());
  const datePart = iso ?? "unknown";
  return `${displayId.trim()}|${datePart}|${transactionType.trim().toLowerCase()}`;
}

/** Pick an importKey that satisfies the DB unique constraint while keeping displayId reusable. */
export async function ensureUniqueImportKey(
  workspaceId: string,
  displayId: string,
  date: string,
  transactionType: string,
  db: DbClient,
  excludeTransactionId?: string
): Promise<string> {
  const base = buildTransactionImportKey(displayId, date, transactionType);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const conflict = await db.transaction.findFirst({
      where: {
        workspaceId,
        importKey: candidate,
        ...(excludeTransactionId ? { id: { not: excludeTransactionId } } : {}),
      },
      select: { id: true },
    });
    if (!conflict) return candidate;
    candidate = `${base}#${suffix}`;
    suffix += 1;
  }
}
