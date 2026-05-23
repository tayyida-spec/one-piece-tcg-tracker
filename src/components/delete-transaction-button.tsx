"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DeleteTransactionButton({ id }: { id: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Delete this transaction and reverse inventory qty changes?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/transactions");
      router.refresh();
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={onDelete}>
      Delete
    </Button>
  );
}
