"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSession } from "@/hooks/user-session";

type RentNowButtonProps = {
  itemId: string;
  quantity?: number;
  className?: string;
  children?: React.ReactNode;
};

export function RentNowButton({
  itemId,
  quantity = 1,
  className,
  children,
}: RentNowButtonProps) {
  const router = useRouter();
  const { session, loading } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  async function handleRentNow() {
    if (!session?.user) {
      window.alert("Please sign up or log in first to rent items.");
      return;
    }

    setIsLoading(true);
    try {
      // Add item to cart first
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to add to cart");
      }

      // Notify header/cart badge listeners
      window.dispatchEvent(new Event("cart:updated"));

      // Redirect to cart for checkout
      router.push("/cart");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unable to rent this item";
      window.alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isLoading || loading}
      onClick={handleRentNow}
      className={className}
    >
      {isLoading ? "Adding..." : children ?? "Rent Now"}
    </button>
  );
}
