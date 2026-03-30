"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useSession } from "@/hooks/user-session";

type AddToCartButtonProps = {
  itemId: string;
  quantity?: number;
  className?: string;
  children?: ReactNode;
  autoRedirect?: boolean; // If true, redirect to cart immediately after adding (for "Rent Now")
};

export function AddToCartButton({
  itemId,
  quantity = 1,
  className,
  children,
  autoRedirect = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { session, loading } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if item is already in cart on mount
  useEffect(() => {
    async function checkIfInCart() {
      if (!session?.user) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch("/api/cart/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        });

        const result = await response.json();
        setIsAdded(result.isInCart || false);
      } catch (err) {
        console.error("Failed to check cart status:", err);
      } finally {
        setIsChecking(false);
      }
    }

    checkIfInCart();
  }, [session?.user, itemId]);

  async function handleAddToCart() {
    if (!session?.user) {
      window.alert("Please sign up or log in first to add items to cart.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });

      const result = await response.json();
      
      if (!response.ok || !result?.success) {
        const errorMsg = result?.error || "Unable to add to cart";
        setError(errorMsg);
        window.alert(errorMsg);
        throw new Error(errorMsg);
      }

      setIsAdded(true);
      setError(null);

      // Notify header/cart badge listeners without forcing a full route refresh.
      window.dispatchEvent(new Event("cart:updated"));

      // Auto-redirect to cart if this is a "Rent Now" button
      if (autoRedirect) {
        setTimeout(() => router.push("/cart"), 300);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unable to add to cart";
      setError(errorMsg);
      console.error("Add to cart error:", errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoToCart() {
    router.push("/cart");
  }

  if (isAdded) {
    return (
      <button
        type="button"
        disabled={isLoading || loading || isChecking}
        onClick={handleGoToCart}
        className={className}
        title="Go to your cart to proceed with checkout"
      >
        Go to Cart
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isLoading || loading || isChecking}
      onClick={handleAddToCart}
      className={className}
      title="Add this item to your cart"
    >
      {isChecking || isLoading ? "Adding..." : children ?? "Add to Cart"}
    </button>
  );
}
