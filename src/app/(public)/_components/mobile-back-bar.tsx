"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function MobileBackBar({ fallbackHref = "/rentals" }: { fallbackHref?: string }) {
  const router = useRouter();

  const handleBack = () => {
    // go back in history if possible, otherwise navigate to fallback
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <div className="sticky top-0 z-200 flex items-center gap-2 border-b border-gray-200 bg-white px-3 py-3 lg:hidden">
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="inline-flex items-center justify-center rounded-full p-1.5 text-foreground hover:bg-muted active:bg-muted/80"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
