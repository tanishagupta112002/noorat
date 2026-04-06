"use client";

import { ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function SameDayDeliveryButton({ mobile, className }: { mobile?: boolean; className?: string }) {
  const router = useRouter();

  const handleClick = () => {
    router.push("/designer-studios/nearby");
  };

  return (
    <Button
      onClick={handleClick}
      className={cn(
        "border-none shadow-none",
        mobile
          ? "h-8 shrink-0 gap-1 rounded-none bg-transparent px-0 text-[#6d3d43] hover:bg-transparent hover:text-[#6d3d43]/80"
          : "h-8 rounded-none bg-transparent text-white hover:bg-transparent hover:text-white/80",
        mobile
          ? "text-[11px] font-semibold uppercase tracking-wide"
          : "text-sm font-semibold uppercase tracking-wide",
        className,
      )}
    >
      <Zap className={cn("fill-current shrink-0", mobile ? "h-3 w-3" : "h-3 w-3")} />
      <span className="whitespace-nowrap underline underline-offset-2">Delivery within 24hrs</span>
      <ChevronDown className={cn("shrink-0", mobile ? "h-3 w-3" : "h-3 w-3")} />
    </Button>
  );
}
