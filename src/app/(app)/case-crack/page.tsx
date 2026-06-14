import { requireUser } from "@/lib/auth";
import { loadCrackableCases } from "@/lib/case-crack-service";
import { CaseCrackForm } from "@/components/case-crack-form";
import { PageHeading } from "@/components/page-heading";

export default async function CaseCrackPage() {
  const { workspaceId } = await requireUser();
  const cases = await loadCrackableCases(workspaceId);

  return (
    <div className="space-y-4">
      <PageHeading
        title="Case crack"
        description="Open a sealed case and log every pull in one go. Case stock −1, singles go to Inventory. No prices — add expenses separately. Sell later under the same TXN."
      />
      <CaseCrackForm cases={cases} />
    </div>
  );
}
