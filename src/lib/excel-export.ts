import * as XLSX from "xlsx";

import { prisma } from "@/lib/prisma";

import { formatExcelDate, formatExcelNumber, displayInventoryStatus } from "@/lib/utils";

function displayItemTypeExport(itemType: string) {
  const t = itemType.toLowerCase();
  if (t === "sealed" || t === "case") return "Case";
  if (t === "merchandise") return "Merchandise";
  return "Cards";
}



function displayTransactionTypeExport(type: string) {

  const t = type.toLowerCase();

  if (t === "buy") return "Buy";

  if (t === "sell") return "Sell";

  if (t === "trade") return "Trade";

  if (t === "gift") return "Gift";

  return "Adjustment";

}



export async function buildWorkbookBuffer(workspaceId: string): Promise<Buffer> {

  const [inventory, lines] = await Promise.all([

    prisma.inventoryItem.findMany({

      where: { workspaceId },

      orderBy: [{ status: "asc" }, { cardName: "asc" }],

    }),

    prisma.transactionLine.findMany({

      where: { transaction: { workspaceId } },

      include: { transaction: true },

      orderBy: [

        { transaction: { date: "desc" } },

        { transaction: { displayId: "asc" } },

        { cardName: "asc" },

      ],

    }),

  ]);



  const inventoryRows = inventory.map((item) => ({

    "Item Type": displayItemTypeExport(item.itemType),

    "Card/Item Name": item.cardName,

    "Card/Item ID": item.cardId,

    Series: item.series,

    Rarity: item.rarity,

    Language: item.language,

    Variant: item.variant,

    Condition: item.condition ?? "",

    Quantity: formatExcelNumber(Number(item.quantity)),

    Location: item.location ?? "",

    "Purchase Price (SGD)": item.purchasePrice != null ? Number(item.purchasePrice) : "",

    "Current Market Price (SGD)":

      item.currentMarketPrice != null ? Number(item.currentMarketPrice) : "",

    Owner: item.owner ?? "",

    Status: displayInventoryStatus(item.status),

    Notes: item.notes ?? "",

  }));



  const transactionRows = lines.map((line) => ({

    "Transaction ID": line.transaction.displayId,

    "Item Type": displayItemTypeExport(line.itemType),

    Date: formatExcelDate(line.transaction.date),

    "Card/Item Name": line.cardName,

    "Card/Item ID": line.cardId,

    Series: line.series,

    Rarity: line.rarity,

    "Transaction Type": displayTransactionTypeExport(line.transaction.transactionType),

    Quantity: formatExcelNumber(Number(line.quantity)),

    "Unit Price (SGD)": Number(line.unitPrice),

    "Smartpac (SGD)":

      line.smartpacFee != null

        ? Number(line.smartpacFee)

        : line.transaction.smartpacFee != null

          ? Number(line.transaction.smartpacFee)

          : "",

    "Owner/Buyer/Seller": line.owner ?? "",

    Reimbursement: line.reimbursement ?? "",

    Platform: line.platform ?? "",

    Notes: line.notes ?? "",

  }));



  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(

    wb,

    XLSX.utils.json_to_sheet(inventoryRows),

    "Cards Inventory"

  );

  XLSX.utils.book_append_sheet(

    wb,

    XLSX.utils.json_to_sheet(transactionRows),

    "Transaction Log"

  );



  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));

}

