"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

type CartItemControlsProps = {
  itemId: string;
  quantity: number;
  isRental?: boolean;
};

export function CartItemControls({ itemId, quantity, isRental = true }: CartItemControlsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function updateQuantity(nextQuantity: number) {
    setBusy(true);
    try {
      const response = await fetch("/api/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: nextQuantity }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Could not update quantity");
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not update quantity");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem() {
    setBusy(true);
    try {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Could not remove item");
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not remove item");
    } finally {
      setBusy(false);
    }
  }

  // For rentals, show quantity as fixed (1)
  if (isRental) {
    return (
      <button
        type="button"
        onClick={removeItem}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#ebd4d4] bg-[#fffdfd] px-3 py-1.5 text-[11px] font-medium text-destructive transition hover:bg-[#fff6f6] disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        <span>{busy ? "Removing" : "Remove"}</span>
      </button>
    );
  }

  // For non-rentals, show +/- controls
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[#d9d9d9] bg-white p-1 shadow-[0_1px_1px_rgba(0,0,0,0.03)]">
      <button
        type="button"
        onClick={() => updateQuantity(quantity - 1)}
        disabled={busy || quantity <= 1}
        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-foreground transition hover:bg-[#f5f5f5] disabled:opacity-50"
      >
        −
      </button>
      <span className="min-w-8 rounded-full bg-[#f7f7f7] px-2 py-1 text-center text-xs font-semibold text-foreground">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => updateQuantity(quantity + 1)}
        disabled={busy}
        className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-foreground transition hover:bg-[#f5f5f5] disabled:opacity-50"
      >
        +
      </button>
      <button
        type="button"
        onClick={removeItem}
        disabled={busy}
        className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-destructive transition hover:bg-[#fff6f6] disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
