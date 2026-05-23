import Link from "next/link";

import { Suspense } from "react";

import { requireUser } from "@/lib/auth";

import { getCachedInventoryRows } from "@/lib/inventory-data";

import { Button } from "@/components/ui/button";

import { InventoryTable } from "@/components/inventory-table";

import { PageHeading } from "@/components/page-heading";

import { TableSectionSkeleton } from "@/components/table-section-skeleton";

async function InventoryTableSection() {

  const { workspaceId } = await requireUser();

  const rows = await getCachedInventoryRows(workspaceId);

  return <InventoryTable rows={rows} />;

}



export default function InventoryPage() {

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



      <Suspense fallback={<TableSectionSkeleton />}>

        <InventoryTableSection />

      </Suspense>

    </div>

  );

}

