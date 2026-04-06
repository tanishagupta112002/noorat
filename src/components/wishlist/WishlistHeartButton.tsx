"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/hooks/user-session";

type WishlistHeartButtonProps = {
  itemId: string;
  className?: string;
  iconClassName?: string;
  containerClassName?: string;
};

export function WishlistHeartButton({
  itemId,
  className,
  iconClassName,
  containerClassName,
}: WishlistHeartButtonProps) {
  const router = useRouter();
  const { session, loading } = useSession();
  const [hasMounted, setHasMounted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const checkWishlist = async () => {
      try {
        const response = await fetch("/api/wishlist/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsAdded(Boolean(data.inWishlist));
        }
      } catch {
        // no-op for non-critical UI state
      }
    };

    checkWishlist();
  }, [session?.user?.id, itemId]);

  async function handleWishlistToggle() {
    if (!session?.user) {
      window.alert("Please sign up or log in first to add favourites.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        isAdded ? "/api/wishlist/remove" : "/api/wishlist/add",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId }),
        },
      );

      if (response.ok) {
        setIsAdded((prev) => !prev);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 1500);
        router.refresh();
      }
    } catch {
      window.alert("Could not update wishlist right now.");
    } finally {
      setIsLoading(false);
    }
  }

  const buttonClassName =
    className ||
    `inline-flex h-8 w-8 items-center justify-center rounded-full border bg-background/95 shadow-sm backdrop-blur transition-all hover:scale-105 ${
      isAdded
        ? "border-rose-300 text-rose-600"
        : "border-border text-foreground/70 hover:text-rose-500"
    }`;

  const isDisabled = isLoading || (hasMounted && loading);

  return (
    <div className={containerClassName || "relative"}>
      <button
        type="button"
        onClick={handleWishlistToggle}
        disabled={isDisabled}
        aria-label={isAdded ? "Remove from favourites" : "Add to favourites"}
        className={buttonClassName}
      >
        <Heart className={iconClassName || `h-4 w-4 ${isAdded ? "fill-current" : ""}`} />
      </button>

      {showMessage ? (
        <div className="absolute -top-9 right-0 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-[10px] font-medium text-background">
          {isAdded ? "Added" : "Removed"}
        </div>
      ) : null}
    </div>
  );
}
