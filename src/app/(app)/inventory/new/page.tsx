import { InventoryForm } from "@/components/inventory-form";
import { PageHeading } from "@/components/page-heading";

export default function NewInventoryPage() {
  return (
    <div className="space-y-4">
      <PageHeading title="Add inventory item" />
      <InventoryForm />
    </div>
  );
}
