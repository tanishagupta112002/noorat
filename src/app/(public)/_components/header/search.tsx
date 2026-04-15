"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const animationStyle = `
  @keyframes slideUpFade {
    0% {
      opacity: 1;
      transform: translateY(0px);
    }
    100% {
      opacity: 0;
      transform: translateY(-50px);
    }
  }
  
  .placeholder-animate {
    animation: slideUpFade 1s ease-out forwards;
  }
`;

type SearchProps = {
  mobileLogoSrc?: string;
  mobilePlaceholder?: string;
};

const ROTATING_PLACEHOLDERS = [
  "Search outfits",
  "Search studios",
  "Search designers",
  "Search brands",
];

const PLACEHOLDER_HOLD_MS = 2000;
const PLACEHOLDER_ANIMATION_MS = 1000;

export default function Search({ mobileLogoSrc, mobilePlaceholder }: SearchProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasMobileLogo = Boolean(mobileLogoSrc);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(ROTATING_PLACEHOLDERS[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  const defaultQuery = useMemo(() => {
    if (pathname !== "/rentals") return "";
    return searchParams.get("q") ?? "";
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!hasMobileLogo) return;

    let index = 0;
    let holdTimeout: ReturnType<typeof setTimeout> | undefined;
    let cycleTimeout: ReturnType<typeof setTimeout> | undefined;

    const runCycle = () => {
      setIsAnimating(false);

      holdTimeout = setTimeout(() => {
        setIsAnimating(true);
      }, PLACEHOLDER_HOLD_MS);

      cycleTimeout = setTimeout(() => {
        index = (index + 1) % ROTATING_PLACEHOLDERS.length;
        setCurrentPlaceholder(ROTATING_PLACEHOLDERS[index]);
        runCycle();
      }, PLACEHOLDER_HOLD_MS + PLACEHOLDER_ANIMATION_MS);
    };

    runCycle();

    return () => {
      if (holdTimeout) clearTimeout(holdTimeout);
      if (cycleTimeout) clearTimeout(cycleTimeout);
    };
  }, [hasMobileLogo]);

  return (
    <>
      <style>{animationStyle}</style>
      <form
        action="/rentals"
        method="get"
        className={hasMobileLogo
          ? "w-full flex flex-row items-center gap-1 rounded-xl border border-border bg-white px-2 py-1"
          : "w-full flex flex-row items-center gap-1.5 rounded-lg border border-border lg:border-white/70 bg-white px-1 py-0.5"}
      >
      <div className="relative flex-1 min-w-0">
        {hasMobileLogo && mobileLogoSrc ? (
          <Image
            src={mobileLogoSrc}
            alt="Noorat"
            width={54}
            height={54}
            className="pointer-events-none absolute left-0 top-1/2 h-6 w-auto -translate-y-1/2 object-contain z-10"
          />
        ) : null}
        <div className="relative flex-1 overflow-hidden">
          <Input
            type="text"
            name="q"
            defaultValue={defaultQuery}
            placeholder={hasMobileLogo ? "" : (mobilePlaceholder ?? "Search outfits, designer studios and more...")}
            className={hasMobileLogo
              ? "h-8 border-none bg-white pl-10 text-sm shadow-none focus:ring-0 focus-visible:ring-0"
              : "h-7 text-xs border-none bg-white shadow-none focus:ring-0 focus-visible:ring-0"}
          />
          {hasMobileLogo && (
            <span className={`absolute left-10 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none whitespace-nowrap ${
              isAnimating ? 'placeholder-animate' : ''
            }`}>
              {currentPlaceholder}
            </span>
          )}
        </div>
      </div>

      <Button
        type="submit"
        size="sm"
        className={hasMobileLogo
          ? "h-8 w-8 shrink-0 rounded-full border-none bg-white p-0 text-muted-foreground shadow-none ring-0 outline-none hover:bg-white"
          : "h-7 w-7 p-0 shrink-0 border-none shadow-none ring-0 outline-none bg-white text-foreground hover:bg-white/90"}
      >
        <SearchIcon className="h-4 w-4" />
      </Button>
    </form>
    </>
  );
}
