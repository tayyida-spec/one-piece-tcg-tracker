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

/** Pick a unique importKey in one query (displayId can repeat). */
export async function ensureUniqueImportKey(
  workspaceId: string,
  displayId: string,
  date: string,
  transactionType: string,
  db: DbClient,
  excludeTransactionId?: string
): Promise<string> {
  const base = buildTransactionImportKey(displayId, date, transactionType);

  const conflicts = await db.transaction.findMany({
    where: {
      workspaceId,
      OR: [{ importKey: base }, { importKey: { startsWith: `${base}#` } }],
      ...(excludeTransactionId ? { id: { not: excludeTransactionId } } : {}),
    },
    select: { importKey: true },
  });

  if (conflicts.length === 0) return base;

  let maxSuffix = 1;
  for (const row of conflicts) {
    if (row.importKey === base) {
      maxSuffix = Math.max(maxSuffix, 1);
      continue;
    }
    const match = /#(\d+)$/.exec(row.importKey);
    if (match) maxSuffix = Math.max(maxSuffix, Number(match[1]));
  }

  return `${base}#${maxSuffix + 1}`;
}
