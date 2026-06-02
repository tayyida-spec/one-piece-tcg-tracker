-- Seed initial capital contributions (S$5,000 total). Idempotent — skips if any exist.
-- Run after 2026-06-capital-market-price.sql

INSERT INTO "CapitalContribution" (
  "id", "workspaceId", "date", "amount", "contributor", "notes", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  w."id",
  '2026-01-01'::timestamp,
  v.amount,
  v.contributor,
  'Initial workspace capital',
  NOW(),
  NOW()
FROM "Workspace" w
CROSS JOIN (
  VALUES
    ('Ben',   1050.00),
    ('Caleb', 1050.00),
    ('Timmy', 1000.00),
    ('Yi Da',  950.00),
    ('Matt',   950.00)
) AS v(contributor, amount)
WHERE w."inviteCode" = 'three-hats-2026'
  AND NOT EXISTS (
    SELECT 1 FROM "CapitalContribution" c WHERE c."workspaceId" = w."id"
  );
