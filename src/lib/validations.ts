import { z } from "zod";

export const inventoryItemSchema = z.object({
  itemType: z.enum(["card", "sealed", "merchandise"]).default("card"),
  cardName: z.string().min(1),
  cardId: z.string().min(1),
  series: z.string().optional(),
  rarity: z.string().optional(),
  language: z.string().default("JP"),
  variant: z.string().optional(),
  condition: z.string().optional().nullable(),
  quantity: z.coerce.number().min(0),
  location: z.string().optional().nullable(),
  purchasePrice: z.coerce.number().optional().nullable(),
  currentMarketPrice: z.coerce.number().optional().nullable(),
  owner: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photoUrl: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null))
    .refine((v) => v === null || /^https?:\/\//.test(v), "Photo URL must be http(s)"),
  status: z.enum(["in_stock", "sold_out", "cracked"]).optional(),
});

export const transactionLineSchema = z.object({
  itemType: z.enum(["card", "sealed", "merchandise", "case"]).default("card"),
  cardName: z.string().min(1),
  cardId: z.string().min(1),
  series: z.string().optional(),
  rarity: z.string().optional(),
  language: z.string().default("JP"),
  variant: z.string().optional(),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  owner: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  inventoryItemId: z.string().optional().nullable(),
});

export const transactionLineEditSchema = z.object({
  displayId: z.string().min(1),
  itemType: z.enum(["card", "sealed", "merchandise", "case"]).default("card"),
  date: z.string().min(1),
  cardName: z.string().min(1),
  cardId: z.string().min(1),
  series: z.string().optional(),
  rarity: z.string().optional(),
  transactionType: z.enum(["buy", "sell", "trade", "gift", "adjustment"]),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().min(0),
  smartpacFee: z.coerce.number().optional().nullable(),
  owner: z.string().optional().nullable(),
  reimbursement: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const BUSINESS_EXPENSE_CATEGORIES = [
  "Card Supplies",
  "Stock / Pre-order",
  "Subscription",
  "Marketing",
  "Shipping & Packaging",
  "Platform Fees",
  "Equipment",
  "Storage",
  "Professional Services",
  "Travel & Transport",
  "Miscellaneous",
] as const;

export const businessExpenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  itemName: z.string().min(1, "Item/service name is required"),
  vendor: z.string().optional().nullable(),
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().min(0, "Amount must be 0 or more"),
  paymentMethod: z.string().optional().nullable(),
  recurring: z.coerce.boolean().optional().default(false),
  frequency: z.string().optional().nullable(),
  owner: z.string().optional().nullable(),
  reimbursement: z.string().optional().nullable(),
  expenseCode: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const dashboardPrefsSchema = z.object({
  hidden: z.array(z.string()).max(50),
  order: z.array(z.string()).max(50).optional(),
});

export const capitalContributionSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  contributor: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const memberUpdateSchema = z.object({
  displayName: z
    .string()
    .max(80)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  role: z.enum(["admin", "member"]).optional(),
});

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .max(80)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
});

export const passwordChangeSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** Quick add: card id / series / rarity / variant / owner / notes can be filled in later via Edit. */
export const transactionLineQuickAddSchema = transactionLineSchema.extend({
  cardId: z.string().default(""),
  series: z.string().default(""),
  rarity: z.string().default(""),
  variant: z.string().default(""),
});

export const quickAddTransactionSchema = z.object({
  transactionType: z.enum(["buy", "sell", "trade", "gift", "adjustment"]),
  date: z.string().min(1),
  displayId: z.string().min(1).optional(),
  batchLabel: z.string().optional().nullable(),
  smartpacFee: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(transactionLineQuickAddSchema).min(1),
});

export const transactionSchema = z.object({
  transactionType: z.enum(["buy", "sell", "trade", "gift", "adjustment"]),
  date: z.string().min(1),
  displayId: z.string().min(1).optional(),
  batchLabel: z.string().optional().nullable(),
  smartpacFee: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(transactionLineSchema).min(1),
});

/** One pulled card when cracking a sealed case — inventory only, no unit price. */
export const caseCrackLineSchema = z.object({
  cardName: z.string().min(1, "Card name is required"),
  cardId: z.string().default(""),
  series: z.string().default(""),
  rarity: z.string().default(""),
  variant: z.string().default(""),
  language: z.string().default("JP"),
  quantity: z.coerce.number().positive().default(1),
  notes: z.string().optional().nullable(),
});

export const caseCrackSchema = z.object({
  sealedItemId: z.string().min(1, "Select a case"),
  referenceTxn: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(caseCrackLineSchema).min(1, "Add at least one card"),
});
