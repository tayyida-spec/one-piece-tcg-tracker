import Link from "next/link";

import { requireUser } from "@/lib/auth";

import { getCachedDashboardPayload } from "@/lib/dashboard-data";

import { formatDate } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { MonthlyPlDashboard } from "@/components/monthly-pl-dashboard";

import { PageHeading, SectionHeading } from "@/components/page-heading";

export default async function DashboardPage() {

  const { workspaceId } = await requireUser();

  const {

    transactionCount,

    inventoryCount,

    inStockCount,

    plData,

    plLines,

    inventorySnapshot,

    recentTransactions,

  } = await getCachedDashboardPayload(workspaceId);



  return (

    <div className="space-y-8">

      <div className="flex flex-wrap items-center justify-between gap-3">

        <PageHeading

          title="Dashboard"

          description="Monthly P/L, portfolio snapshot, and recent activity"

        />

        <div className="flex gap-2">

          <Button asChild>

            <Link href="/quick-add">Quick add</Link>

          </Button>

          <Button variant="outline" asChild>

            <Link href="/inventory/new">Add card</Link>

          </Button>

        </div>

      </div>



      <div className="grid gap-4 sm:grid-cols-3">

        <StatCard label="Inventory rows" value={String(inventoryCount)} />

        <StatCard label="In stock" value={String(inStockCount)} />

        <StatCard label="Transactions" value={String(transactionCount)} />

      </div>



      <MonthlyPlDashboard data={plData} lines={plLines} inventory={inventorySnapshot} />



      <section>

        <div className="mb-3">

          <SectionHeading title="Recent transactions" />

        </div>

        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">

          {recentTransactions.length === 0 ? (

            <li className="px-4 py-6 text-sm text-muted">No transactions yet.</li>

          ) : (

            recentTransactions.map((t) => (

              <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">

                <div>

                  <p className="font-medium text-foreground">

                    {t.displayId} · {t.transactionType}

                  </p>

                  <p className="text-muted">

                    {t.lineCount} line(s) · {formatDate(t.date)}

                  </p>

                </div>

                <Link

                  href={`/transactions/${t.id}`}

                  className="text-brand underline hover:text-brand-hover"

                >

                  View

                </Link>

              </li>

            ))

          )}

        </ul>

      </section>

    </div>

  );

}



function StatCard({ label, value }: { label: string; value: string }) {

  return (

    <div className="rounded-lg border border-border bg-surface p-4">

      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>

      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>

    </div>

  );

}

