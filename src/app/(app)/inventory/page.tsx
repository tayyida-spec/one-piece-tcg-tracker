import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { loadInventoryRows } from "@/lib/inventory-data";
import { Button } from "@/components/ui/button";
import { InventoryTable } from "@/components/inventory-table";
import { ExportExcelButton } from "@/components/export-excel-button";
import { PageHeading } from "@/components/page-heading";
import { TableSectionSkeleton } from "@/components/table-section-skeleton";

export const dynamic = "force-dynamic";

async function InventoryTableSection() {
  const { workspaceId } = await requireUser();
  const rows = await loadInventoryRows(workspaceId);
  return <InventoryTable rows={rows} />;
}

export default function InventoryPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading
          title="Inventory"
          description="Live stock list — new sealed cases show immediately; use “Log as transaction” when adding a case if you want it on the Transaction Log"
        />
        <div className="flex flex-wrap gap-2">
          <ExportExcelButton />
          <Button asChild>
            <Link href="/inventory/new">Add item</Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<TableSectionSkeleton />}>
        <InventoryTableSection />
      </Suspense>
    </div>
  );
}
