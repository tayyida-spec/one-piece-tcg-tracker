import { TransactionForm } from "@/components/transaction-form";
import { PageHeading } from "@/components/page-heading";

export default function NewTransactionPage() {
  return (
    <div className="space-y-4">
      <PageHeading title="New transaction" />
      <TransactionForm />
    </div>
  );
}
