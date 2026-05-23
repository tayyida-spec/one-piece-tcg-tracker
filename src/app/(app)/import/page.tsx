import { ImportForm } from "@/components/import-form";
import { PageHeading } from "@/components/page-heading";

export default function ImportPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        title="Import Excel"
        description="Migrate from your existing Three Hats spreadsheet."
      />
      <ImportForm />
    </div>
  );
}
