import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TransactionLogRow } from "@/components/transaction-log-table";
import { transactionsCacheTag } from "@/lib/cache-tags";
import type { TransactionLogPage } from "@/lib/transaction-log-types";

export type { TransactionLogPage };


export const TRANSACTION_LOG_PAGE_SIZE = 75;

/** Types shown on the Transaction Log page (buys & sells only). */
export const TRANSACTION_LOG_TYPES = ["buy", "sell"] as const;

function transactionLogLineWhere(
  workspaceId: string,
  extra?: { date?: { gte: Date; lt: Date } }
) {
  return {
    transaction: {
      workspaceId,
      transactionType: { in: [...TRANSACTION_LOG_TYPES] },
      ...extra,
    },
  };
}



const lineSelect = {

  id: true,

  itemType: true,

  cardName: true,

  cardId: true,

  series: true,

  rarity: true,

  quantity: true,

  unitPrice: true,

  smartpacFee: true,

  owner: true,

  reimbursement: true,

  platform: true,

  notes: true,

  transaction: {

    select: {

      id: true,

      displayId: true,

      transactionType: true,

      date: true,

      smartpacFee: true,

    },

  },

} as const;



function mapLine(line: {

  id: string;

  itemType: string;

  cardName: string;

  cardId: string;

  series: string;

  rarity: string;

  quantity: unknown;

  unitPrice: unknown;

  smartpacFee: unknown;

  owner: string | null;

  reimbursement: string | null;

  platform: string | null;

  notes: string | null;

  transaction: {

    id: string;

    displayId: string;

    transactionType: string;

    date: Date;

    smartpacFee: unknown;

  };

}): TransactionLogRow {

  return {

    id: line.id,

    itemType: line.itemType,

    cardName: line.cardName,

    cardId: line.cardId,

    series: line.series,

    rarity: line.rarity,

    quantity: Number(line.quantity),

    unitPrice: Number(line.unitPrice),

    smartpacFee: line.smartpacFee != null ? Number(line.smartpacFee) : null,

    owner: line.owner,

    reimbursement: line.reimbursement,

    platform: line.platform,

    notes: line.notes,

    transaction: {

      id: line.transaction.id,

      displayId: line.transaction.displayId,

      transactionType: line.transaction.transactionType,

      date: line.transaction.date.toISOString(),

      smartpacFee:

        line.transaction.smartpacFee != null ? Number(line.transaction.smartpacFee) : null,

    },

  };

}



function monthDateRange(month: string): { gte: Date; lt: Date } | null {

  const match = /^(\d{4})-(\d{2})$/.exec(month.trim());

  if (!match) return null;

  const y = Number(match[1]);

  const m = Number(match[2]) - 1;

  if (m < 0 || m > 11) return null;

  const gte = new Date(Date.UTC(y, m, 1));

  const lt = new Date(Date.UTC(y, m + 1, 1));

  return { gte, lt };
}

export async function loadTransactionLogPage(
  workspaceId: string,

  opts: { limit?: number; offset?: number; month?: string | null } = {}

): Promise<TransactionLogPage> {

  const limit = Math.min(Math.max(opts.limit ?? TRANSACTION_LOG_PAGE_SIZE, 1), 200);

  const offset = Math.max(opts.offset ?? 0, 0);

  const range = opts.month ? monthDateRange(opts.month) : null;



  const where = transactionLogLineWhere(workspaceId, range ? { date: range } : undefined);



  const [lines, total] = await Promise.all([

    prisma.transactionLine.findMany({

      where,

      orderBy: [

        { transaction: { date: "desc" } },

        { transaction: { displayId: "asc" } },

        { cardName: "asc" },

      ],

      skip: offset,

      take: limit,

      select: lineSelect,

    }),

    prisma.transactionLine.count({ where }),

  ]);



  return {

    rows: lines.map(mapLine),

    total,

    limit,

    offset,

    hasMore: offset + lines.length < total,

    month: opts.month ?? null,

  };

}



export async function loadTransactionLogMonths(workspaceId: string): Promise<string[]> {

  const rows = await prisma.transaction.findMany({

    where: { workspaceId, transactionType: { in: [...TRANSACTION_LOG_TYPES] } },

    select: { date: true },

    orderBy: { date: "desc" },

  });

  const months = new Set<string>();

  for (const row of rows) {

    const d = row.date;

    months.add(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);

  }

  return [...months].sort((a, b) => b.localeCompare(a));

}



async function loadAllTransactionLogRows(workspaceId: string): Promise<TransactionLogRow[]> {

  const lines = await prisma.transactionLine.findMany({

    where: transactionLogLineWhere(workspaceId),

    orderBy: [

      { transaction: { date: "desc" } },

      { transaction: { displayId: "asc" } },

      { cardName: "asc" },

    ],

    select: lineSelect,

  });

  return lines.map(mapLine);

}



/** @deprecated Prefer loadTransactionLogPage for the transactions UI. */

export function getCachedTransactionLogRows(workspaceId: string) {

  return unstable_cache(

    () => loadAllTransactionLogRows(workspaceId),

    [transactionsCacheTag(workspaceId)],

    { revalidate: 120, tags: [transactionsCacheTag(workspaceId)] }

  )();

}

