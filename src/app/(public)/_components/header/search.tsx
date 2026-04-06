"use client";

import { useMemo } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SearchProps = {
  mobileLogoSrc?: string;
  mobilePlaceholder?: string;
};

export default function Search({ mobileLogoSrc, mobilePlaceholder }: SearchProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasMobileLogo = Boolean(mobileLogoSrc);

  const defaultQuery = useMemo(() => {
    if (pathname !== "/rentals") return "";
    return searchParams.get("q") ?? "";
  }, [pathname, searchParams]);

  return (
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
            className="pointer-events-none absolute left-0 top-1/2 h-6 w-auto -translate-y-1/2 object-contain"
          />
        ) : null}
        <Input
          type="text"
          name="q"
          defaultValue={defaultQuery}
          placeholder={mobilePlaceholder ?? "Search outfits..."}
          className={hasMobileLogo
            ? "h-8 border-none bg-white pl-10 text-sm shadow-none focus:ring-0 focus-visible:ring-0"
            : "h-7 text-xs border-none bg-white shadow-none focus:ring-0 focus-visible:ring-0"}
        />
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
  );
}
