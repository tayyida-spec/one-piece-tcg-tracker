"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function InventorySearch({
  initialQ,
  initialStatus,
}: {
  initialQ: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(formData: FormData) {
    const params = new URLSearchParams(searchParams.toString());
    const q = String(formData.get("q") ?? "").trim();
    const status = String(formData.get("status") ?? "");
    if (q) params.set("q", q);
    else params.delete("q");
    if (status) params.set("status", status);
    else params.delete("status");
    router.push(`/inventory?${params.toString()}`);
  }

  return (
    <form action={apply} className="flex flex-wrap gap-2">
      <Input
        name="q"
        placeholder="Search name, ID, series, rarity…"
        defaultValue={initialQ}
        className="max-w-sm"
      />
      <Select name="status" defaultValue={initialStatus}>
        <option value="">All statuses</option>
        <option value="in_stock">In stock</option>
        <option value="sold_out">Sold out</option>
      </Select>
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
