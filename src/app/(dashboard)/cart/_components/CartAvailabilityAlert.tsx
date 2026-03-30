"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

type CartItem = {
  listingId: string;
  quantity: number;
  listing: { title: string };
};

type AvailabilityError = {
  title: string;
  daysUntilAvailable: number | null;
};

type CartAvailabilityAlertProps = {
  cartItems: CartItem[];
  disabled?: boolean;
};

export function CartAvailabilityAlert({ cartItems, disabled }: CartAvailabilityAlertProps) {
  const [errors, setErrors] = useState<AvailabilityError[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAvailability() {
      if (cartItems.length === 0) {
        setErrors([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/cart/check-availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartItems.map((item) => ({
              listingId: item.listingId,
              quantity: item.quantity,
            })),
          }),
        });

        const result = await response.json();
        if (result.unavailableItems) {
          setErrors(result.unavailableItems);
        } else {
          setErrors([]);
        }
      } catch (error) {
        console.error("Failed to check availability:", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkAvailability();
  }, [cartItems]);

  if (isLoading) {
    return null;
  }

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4">
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-red-900 mb-2">Items Not Available</p>
          <ul className="space-y-1 text-sm text-red-800">
            {errors.map((error, idx) => (
              <li key={idx}>
                <strong>"{error.title}"</strong>{" "}
                {error.daysUntilAvailable !== null
                  ? `is fully booked. You can order it after ${error.daysUntilAvailable} day${error.daysUntilAvailable === 1 ? "" : "s"}.`
                  : "is currently unavailable."}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
