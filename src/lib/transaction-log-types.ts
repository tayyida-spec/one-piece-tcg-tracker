import type { TransactionLogRow } from "@/components/transaction-log-table";

export type TransactionLogPage = {
  rows: TransactionLogRow[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  month: string | null;
};
