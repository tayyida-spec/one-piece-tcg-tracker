-- Speed up transaction log filters (workspace + type + date sort).
-- Run on DIRECT_URL; may take a minute on large tables.
CREATE INDEX IF NOT EXISTS "Transaction_workspaceId_transactionType_date_idx"
  ON "Transaction" ("workspaceId", "transactionType", "date" DESC);
