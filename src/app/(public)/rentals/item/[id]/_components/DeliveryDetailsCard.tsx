"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Home, Truck } from "lucide-react";

import {
  DELIVERY_BOOK_UPDATED_EVENT,
  getSelectedDeliveryAddress,
  readDeliveryLocationBook,
  type DeliveryLocationBook,
} from "@/lib/delivery-location";

function formatDeliveryDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    weekday: "short",
  }).format(d);
}

export default function DeliveryDetailsCard() {
  const [book, setBook] = useState<DeliveryLocationBook>({ selectedId: null, addresses: [] });

  useEffect(() => {
    setBook(readDeliveryLocationBook());

    const sync = () => setBook(readDeliveryLocationBook());
    window.addEventListener("storage", sync);
    window.addEventListener(DELIVERY_BOOK_UPDATED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(DELIVERY_BOOK_UPDATED_EVENT, sync);
    };
  }, []);

  const selected = useMemo(() => getSelectedDeliveryAddress(book), [book]);
  const standardStart = formatDeliveryDate(7);
  const standardEnd = formatDeliveryDate(8);
  const localEta = formatDeliveryDate(1);

  return (
    <section className="w-full space-y-3 sm:space-y-4 rounded-lg sm:rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
      <h3 className="text-sm sm:text-base font-semibold text-foreground">Delivery details</h3>

      <div className="rounded-lg sm:rounded-xl bg-white px-3 py-2">
        <div className="flex items-start gap-2 min-w-0">
          <Home className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold">HOME</p>
            <p className="text-xs text-muted-foreground wrap-break-words">
              {selected
                ? [selected.addressLine, selected.city, selected.pincode].filter(Boolean).join(", ")
                : "Select delivery location from top header"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg sm:rounded-xl bg-white px-3 py-2">
        <p className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
          <Truck className="h-4 w-4 shrink-0" />
          <span className="wrap-break-word">Standard delivery between {standardStart} and {standardEnd}</span>
        </p>
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 pl-6">Within locality, next-day delivery by {localEta} may be available.</p>
      </div>
    </section>
  );
}
