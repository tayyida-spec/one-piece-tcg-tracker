import { TransactionForm } from "@/components/transaction-form";
import { PageHeading } from "@/components/page-heading";

export default function QuickAddPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        title="Quick add"
        description="Minimal form for logging a buy or sell right after a trade. Inventory qty updates automatically."
      />
      <TransactionForm compact />
    </div>
  );
}
