"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type InventoryFormValues = {
  id?: string;
  itemType?: string;
  cardName?: string;
  cardId?: string;
  series?: string;
  rarity?: string;
  language?: string;
  variant?: string;
  condition?: string | null;
  quantity?: number;
  location?: string | null;
  purchasePrice?: number | null;
  currentMarketPrice?: number | null;
  owner?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  status?: string;
};

export function InventoryForm({ initial }: { initial?: InventoryFormValues }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      itemType: fd.get("itemType"),
      cardName: fd.get("cardName"),
      cardId: fd.get("cardId"),
      series: fd.get("series"),
      rarity: fd.get("rarity"),
      language: fd.get("language"),
      variant: fd.get("variant"),
      condition: fd.get("condition") || null,
      quantity: fd.get("quantity"),
      location: fd.get("location") || null,
      purchasePrice: fd.get("purchasePrice") || null,
      currentMarketPrice: fd.get("currentMarketPrice") || null,
      owner: fd.get("owner") || null,
      notes: fd.get("notes") || null,
      photoUrl: fd.get("photoUrl") || null,
      status: fd.get("status") || undefined,
    };

    const url = initial?.id ? `/api/inventory/${initial.id}` : "/api/inventory";
    const method = initial?.id ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ? JSON.stringify(data.error) : "Save failed");
      return;
    }

    router.push("/inventory");
    router.refresh();
  }

  async function onDelete() {
    if (!initial?.id) return;
    if (!confirm("Delete this inventory row?")) return;
    const res = await fetch(`/api/inventory/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/inventory");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4 rounded-lg border border-border bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="itemType">Type</Label>
          <Select id="itemType" name="itemType" defaultValue={initial?.itemType ?? "card"}>
            <option value="card">Card</option>
            <option value="sealed">Sealed</option>
            <option value="merchandise">Merchandise</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select id="language" name="language" defaultValue={initial?.language ?? "JP"}>
            <option value="JP">JP</option>
            <option value="EN">EN</option>
            <option value="OTHER">Other</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cardName">Card / item name</Label>
        <Input id="cardName" name="cardName" required defaultValue={initial?.cardName ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cardId">Card ID (e.g. OP11-118)</Label>
        <Input id="cardId" name="cardId" required defaultValue={initial?.cardId ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="series">Series</Label>
          <Input id="series" name="series" defaultValue={initial?.series ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rarity">Rarity</Label>
          <Input id="rarity" name="rarity" defaultValue={initial?.rarity ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="variant">Variant</Label>
          <Input id="variant" name="variant" placeholder="AA, manga, parallel…" defaultValue={initial?.variant ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="condition">Condition</Label>
          <Input id="condition" name="condition" placeholder="NM, LP…" defaultValue={initial?.condition ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" step="0.01" min="0" required defaultValue={initial?.quantity ?? 1} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" placeholder="Binder A, for sale…" defaultValue={initial?.location ?? ""} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Purchase price (SGD)</Label>
          <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" min="0" defaultValue={initial?.purchasePrice ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currentMarketPrice">Market price (SGD)</Label>
          <Input id="currentMarketPrice" name="currentMarketPrice" type="number" step="0.01" min="0" defaultValue={initial?.currentMarketPrice ?? ""} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="owner">Owner (optional)</Label>
        <Input id="owner" name="owner" defaultValue={initial?.owner ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photoUrl">Photo URL</Label>
        <Input id="photoUrl" name="photoUrl" type="url" placeholder="https://…" defaultValue={initial?.photoUrl ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save"}
        </Button>
        {initial?.id ? (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
