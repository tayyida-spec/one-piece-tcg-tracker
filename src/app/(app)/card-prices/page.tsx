import { requireUser } from "@/lib/auth";
import { getCachedCardPrices } from "@/lib/card-price-data";
import { CardPricesClient } from "@/components/card-prices-client";
import { PageHeading } from "@/components/page-heading";
import { getYytJpyToSgdRate } from "@/lib/yuyu-tei-parser";

export const dynamic = "force-dynamic";

export default async function CardPricesPage() {
  const { workspaceId } = await requireUser();
  const rows = await getCachedCardPrices(workspaceId);
  const jpyToSgdRate = getYytJpyToSgdRate();

  return (
    <div className="space-y-4">
      <PageHeading
        title="Card price list"
        description="OP16 reference prices in SGD — independent from inventory. Import from YuYu-Tei to refresh."
      />
      <CardPricesClient rows={rows} jpyToSgdRate={jpyToSgdRate} />
    </div>
  );
}