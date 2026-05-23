import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { InventoryForm } from "@/components/inventory-form";

export default async function EditInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { workspaceId } = await requireUser();
  const { id } = await params;

  const item = await prisma.inventoryItem.findFirst({
    where: { id, workspaceId },
  });

  if (!item) notFound();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-semibold tracking-wide text-foreground">
        Edit inventory
      </h2>
      <InventoryForm
        initial={{
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
          purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
          currentMarketPrice: item.currentMarketPrice ? Number(item.currentMarketPrice) : null,
          owner: item.owner,
          notes: item.notes,
          photoUrl: item.photoUrl,
          status: item.status,
        }}
      />
    </div>
  );
}
