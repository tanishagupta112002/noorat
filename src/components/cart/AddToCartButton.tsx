"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { useSession } from "@/hooks/user-session";

type AddToCartButtonProps = {
  itemId: string;
  quantity?: number;
  className?: string;
  children?: ReactNode;
};

export function AddToCartButton({
  itemId,
  quantity = 1,
  className,
  children,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { session, loading } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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
      } catch (error) {
        console.error("Failed to check cart status:", error);
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
    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to add to cart");
      }

      setIsAdded(true);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to add to cart");
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
    >
      {isChecking || isLoading ? "Adding..." : children ?? "Add to Cart"}
    </button>
  );
}
