import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  nextCodeFromMax,
  neededCodePrefixes,
  resolveDisplayIdWithMax,
} from "@/lib/transaction-codes";

type DbClient = Prisma.TransactionClient | typeof prisma;

const PREFIX_HEAD = { txn: "TXN", bc: "BC" } as const;

/** Single indexed query — max numeric suffix for TXN### or BC### in a workspace. */
export async function fetchMaxCodeSuffix(
  workspaceId: string,
  prefix: "txn" | "bc",
  db: DbClient = prisma
): Promise<number> {
  const head = PREFIX_HEAD[prefix];
  const pattern = `^${head}[0-9]+$`;
  const rows = await db.$queryRaw<{ max_suffix: number | null }[]>`
    SELECT MAX(
      CAST(SUBSTRING("displayId" FROM ${head.length + 1}) AS INTEGER)
    ) AS max_suffix
    FROM "Transaction"
    WHERE "workspaceId" = ${workspaceId}
      AND "displayId" ~* ${pattern}
  `;
  return rows[0]?.max_suffix ?? 0;
}

export async function fetchMaxCodeSuffixes(
  workspaceId: string,
  needed: { txn?: boolean; bc?: boolean },
  db: DbClient = prisma
): Promise<{ txn: number; bc: number }> {
  const [txn, bc] = await Promise.all([
    needed.txn ? fetchMaxCodeSuffix(workspaceId, "txn", db) : Promise.resolve(0),
    needed.bc ? fetchMaxCodeSuffix(workspaceId, "bc", db) : Promise.resolve(0),
  ]);
  return { txn, bc };
}

export async function nextCodeForPrefixAsync(
  workspaceId: string,
  prefix: "txn" | "bc",
  db: DbClient = prisma
): Promise<string> {
  const max = await fetchMaxCodeSuffix(workspaceId, prefix, db);
  return nextCodeFromMax(prefix, max);
}

export async function resolveDisplayIdAsync(
  workspaceId: string,
  raw: string | undefined | null,
  transactionType: string,
  itemType: string | undefined,
  db: DbClient = prisma
): Promise<string> {
  const needed = neededCodePrefixes(raw, transactionType, itemType);
  if (!needed.txn && !needed.bc) {
    return raw?.trim() ?? "";
  }
  const maxSuffixes = await fetchMaxCodeSuffixes(workspaceId, needed, db);
  return resolveDisplayIdWithMax(raw, maxSuffixes, transactionType, itemType);
}
