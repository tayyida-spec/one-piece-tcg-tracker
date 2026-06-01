// Seeds the Business Expenses from "Three Hats (1).xlsx" plus the OP17 pre-order.
// Idempotent: skips a row if an expense with the same code + itemName + amount already exists.
// Run with: node scripts/seed-business-expenses.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INVITE_CODE = process.env.WORKSPACE_INVITE_CODE ?? "three-hats-2026";

const EXPENSES = [
  { expenseCode: "EXP001", category: "Card Supplies", itemName: "Top Loaders", vendor: "Rowell (Shop)", date: "2026-03-01", amount: 5.0, paymentMethod: "PayNow", owner: "Yi Da", reimbursement: "Yes", notes: "Used for OP15 case" },
  { expenseCode: "EXP001", category: "Card Supplies", itemName: "Card Sleeves", vendor: "Rowell (Shop)", date: "2026-03-01", amount: 3.0, paymentMethod: "PayNow", owner: "Yi Da", reimbursement: "Yes", notes: "Used for OP15 case" },
  { expenseCode: "EXP001", category: "Card Supplies", itemName: "Card Storage Box", vendor: "Rowell (Shop)", date: "2026-03-01", amount: 4.0, paymentMethod: "PayNow", owner: "Yi Da", reimbursement: "Yes", notes: "Used for OP15 case" },
  { expenseCode: "EXP002", category: "Miscellaneous", itemName: "ACRA Business Name Registration", vendor: "Bizfile", date: "2026-03-01", amount: 15.0, paymentMethod: "Personal Card", owner: "Caleb", reimbursement: "Yes", notes: null },
  { expenseCode: "EXP003", category: "Miscellaneous", itemName: "ACRA Business Entity Registration", vendor: "Bizfile", date: "2026-03-03", amount: 100.0, paymentMethod: "Personal Card", owner: "Caleb", reimbursement: "Yes", notes: null },
  { expenseCode: "EXP004", category: "Card Supplies", itemName: "Card Sleeves", vendor: "Shopee", date: "2026-03-06", amount: 16.72, paymentMethod: null, owner: "Tim", reimbursement: "Yes", notes: "Used for janks" },
  { expenseCode: "EXP005", category: "Shipping & Packaging", itemName: "Smartpac", vendor: "Shopee", date: "2026-03-06", amount: 64.5, paymentMethod: null, owner: "Ben", reimbursement: "Yes", notes: null },
  { expenseCode: "EXP006", category: "Stock / Pre-order", itemName: "OP17 Cases Pre-order", vendor: null, date: "2026-04-01", amount: 1080.0, paymentMethod: null, owner: null, reimbursement: "No", notes: "Business expense spent on OP17 cases pre-order" },
];

async function main() {
  const workspace = await prisma.workspace.findUnique({ where: { inviteCode: INVITE_CODE } });
  if (!workspace) {
    console.log(`[seed:expenses] Workspace "${INVITE_CODE}" not found — skipping seed.`);
    return;
  }

  // Only seed a fresh workspace; never resurrect expenses the user has since deleted.
  const existingCount = await prisma.businessExpense.count({ where: { workspaceId: workspace.id } });
  if (existingCount > 0) {
    console.log(`[seed:expenses] Workspace already has ${existingCount} expense(s) — skipping seed.`);
    return;
  }

  await prisma.businessExpense.createMany({
    data: EXPENSES.map((e) => ({
      workspaceId: workspace.id,
      expenseCode: e.expenseCode,
      category: e.category,
      itemName: e.itemName,
      vendor: e.vendor,
      date: new Date(e.date),
      amount: e.amount,
      paymentMethod: e.paymentMethod,
      recurring: false,
      frequency: null,
      owner: e.owner,
      reimbursement: e.reimbursement,
      notes: e.notes,
    })),
  });

  const total = EXPENSES.reduce((s, e) => s + e.amount, 0);
  console.log(`[seed:expenses] Inserted ${EXPENSES.length} expenses. Total value: S$${total.toFixed(2)}`);
}

main()
  .catch((e) => {
    // Seeding is best-effort: never block a deploy on it.
    console.error("[seed:expenses] Skipped due to error:", e.message);
  })
  .finally(() => prisma.$disconnect());
