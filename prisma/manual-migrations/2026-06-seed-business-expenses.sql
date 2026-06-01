-- Seeds the Business Expenses from "Three Hats (1).xlsx" + the OP17 pre-order (S$1,080).
-- Run AFTER 2026-06-business-expenses-and-dashboard-prefs.sql, in Supabase → SQL Editor.
-- Idempotent: skips a row that already exists (same code + item + amount) for the workspace.

INSERT INTO "BusinessExpense"
  ("id","workspaceId","expenseCode","category","itemName","vendor","date","amount",
   "paymentMethod","recurring","frequency","owner","reimbursement","notes","createdAt","updatedAt")
SELECT
  gen_random_uuid()::text, w.id, v."expenseCode", v.category, v."itemName", v.vendor,
  v.date::timestamp, v.amount, v."paymentMethod", false, NULL, v.owner, v.reimbursement, v.notes,
  now(), now()
FROM "Workspace" w
CROSS JOIN (VALUES
  ('EXP001','Card Supplies','Top Loaders','Rowell (Shop)','2026-03-01',5.00::numeric,'PayNow','Yi Da','Yes','Used for OP15 case'),
  ('EXP001','Card Supplies','Card Sleeves','Rowell (Shop)','2026-03-01',3.00,'PayNow','Yi Da','Yes','Used for OP15 case'),
  ('EXP001','Card Supplies','Card Storage Box','Rowell (Shop)','2026-03-01',4.00,'PayNow','Yi Da','Yes','Used for OP15 case'),
  ('EXP002','Miscellaneous','ACRA Business Name Registration','Bizfile','2026-03-01',15.00,'Personal Card','Caleb','Yes',NULL),
  ('EXP003','Miscellaneous','ACRA Business Entity Registration','Bizfile','2026-03-03',100.00,'Personal Card','Caleb','Yes',NULL),
  ('EXP004','Card Supplies','Card Sleeves','Shopee','2026-03-06',16.72,NULL,'Tim','Yes','Used for janks'),
  ('EXP005','Shipping & Packaging','Smartpac','Shopee','2026-03-06',64.50,NULL,'Ben','Yes',NULL),
  ('EXP006','Stock / Pre-order','OP17 Cases Pre-order',NULL,'2026-04-01',1080.00,NULL,NULL,'No','Business expense spent on OP17 cases pre-order')
) AS v("expenseCode",category,"itemName",vendor,date,amount,"paymentMethod",owner,reimbursement,notes)
WHERE w."inviteCode" = 'three-hats-2026'
  AND NOT EXISTS (
    SELECT 1 FROM "BusinessExpense" b
    WHERE b."workspaceId" = w.id
      AND b."expenseCode" = v."expenseCode"
      AND b."itemName" = v."itemName"
      AND b."amount" = v.amount
  );
