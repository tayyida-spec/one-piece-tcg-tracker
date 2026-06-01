import { requireUser } from "@/lib/auth";
import { getCachedBusinessExpenses } from "@/lib/business-expense-data";
import { BusinessExpensesClient } from "@/components/business-expenses-client";
import { PageHeading } from "@/components/page-heading";

export default async function BusinessExpensesPage() {
  const { workspaceId } = await requireUser();
  const rows = await getCachedBusinessExpenses(workspaceId);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Business expenses"
        description="Operating costs — card supplies, fees, pre-orders. Counted against net cashflow on the dashboard."
      />
      <BusinessExpensesClient rows={rows} />
    </div>
  );
}
