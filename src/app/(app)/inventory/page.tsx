import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { InventoryTable, type InventoryRow } from "@/components/inventory-table";
import { PageHeading } from "@/components/page-heading";

export default async function InventoryPage() {
  const { workspaceId } = await requireUser();

  const items = await prisma.inventoryItem.findMany({
    where: { workspaceId },
    orderBy: [{ status: "asc" }, { cardName: "asc" }],
  });

  const rows: InventoryRow[] = items.map((item) => ({
    id: item.id,
    itemType: item.itemType,
    cardName: item.cardName,
    cardId: item.cardId,
    series: item.series,
    rarity: item.rarity,
    language: item.language,
    variant: item.variant,
    condition: item.condition,
    quantity: Number(item.quantity),
    location: item.location,
    purchasePrice: Number(item.purchasePrice ?? 0),
    currentMarketPrice: Number(item.currentMarketPrice ?? 0),
    owner: item.owner,
    status: item.status,
    notes: item.notes,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading
          title="Inventory"
          description="Filter any column — type in the box below each header"
        />
        <Button asChild>
          <Link href="/inventory/new">Add item</Link>
        </Button>
      </div>

      <InventoryTable rows={rows} />
    </div>
  );
}
