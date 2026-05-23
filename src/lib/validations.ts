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
  status: z.enum(["in_stock", "sold_out"]).optional(),
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

export const transactionSchema = z.object({
  transactionType: z.enum(["buy", "sell", "trade", "gift", "adjustment"]),
  date: z.string().min(1),
  displayId: z.string().min(1).optional(),
  batchLabel: z.string().optional().nullable(),
  smartpacFee: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(transactionLineSchema).min(1),
});
