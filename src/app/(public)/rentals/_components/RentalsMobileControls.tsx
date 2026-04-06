"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import Link from "next/link";
import { ChevronDown, IndianRupee, MapPin, Palette, Ruler, Shirt, SlidersHorizontal, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type SortItem = {
  label: string;
  href: string;
  selected: boolean;
};

export function RentalsMobileControls({
  selectedFilterChips,
  currentParamEntriesWithoutSort,
  selectedSort,
  sortOptions,
  sortItems,
  filterSheetContent,
  clearAllHref,
  applyHref,
}: {
  selectedFilterChips: string[];
  currentParamEntriesWithoutSort: Array<[string, string]>;
  selectedSort: string;
  sortOptions: string[];
  sortItems: SortItem[];
  filterSheetContent: ReactNode;
  clearAllHref: string;
  applyHref: string;
}) {
  const [activeTab, setActiveTab] = useState("filters-category");

  const mobileFilterTabs = [
    { id: "filters-category", label: "Category", icon: Shirt },
    { id: "filters-boutique", label: "Brand", icon: Store },
    { id: "filters-color", label: "Color", icon: Palette },
    { id: "filters-size", label: "Size", icon: Ruler },
    { id: "filters-price", label: "Price", icon: IndianRupee },
    { id: "filters-city", label: "City", icon: MapPin },
  ] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[];

  const activeSectionClass: Record<string, string> = {
    "filters-category": "[&>div#filters-category]:block",
    "filters-boutique": "[&>div#filters-boutique]:block",
    "filters-color": "[&>div#filters-color]:block",
    "filters-size": "[&>div#filters-size]:block",
    "filters-price": "[&>div#filters-price]:block",
    "filters-city": "[&>div#filters-city]:block",
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {selectedFilterChips.length > 0 ? (
            selectedFilterChips.map((label) => (
              <div
                key={label}
                className="flex shrink-0 items-center rounded-full border border-input bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground/80"
              >
                {label}
              </div>
            ))
          ) : (
            <div className="flex shrink-0 items-center rounded-full border border-input bg-muted/50 px-3 py-1.5 text-xs font-semibold text-foreground/80">
              All Filters
            </div>
          )}
        </div>
        <form action="/rentals" method="get" className="relative">
          {currentParamEntriesWithoutSort.map(([key, value], index) => (
            <input key={`${key}-${value}-${index}`} type="hidden" name={key} value={value} />
          ))}
          <div className="relative">
            <select
              name="sort"
              defaultValue={selectedSort}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
              className="appearance-none rounded-md border border-input bg-background py-1.5 pl-2.5 pr-7 text-xs font-semibold text-foreground"
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background px-3 py-2 shadow-[0_-4px_20px_rgba(15,23,42,0.09)] lg:hidden">
        <div className="grid grid-cols-2 gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 gap-2 rounded-none border-input text-sm font-bold uppercase tracking-wide">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-3/4 sm:max-w-sm p-0 pt-[env(safe-area-inset-top)] [&>button]:hidden">
              <div className="flex h-full flex-col bg-background">
                <div className="flex h-14 items-center justify-between border-b border-border px-3">
                  <div className="flex items-center gap-2">
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none text-foreground">
                        <span className="text-3xl leading-none">×</span>
                      </Button>
                    </SheetClose>
                    <span className="text-lg font-medium text-foreground">Filter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={clearAllHref} className="px-2 text-lg font-normal text-muted-foreground">
                      Reset
                    </Link>
                    <SheetClose asChild>
                      <Link href={applyHref} className="bg-primary px-4 py-2 text-lg font-medium text-primary-foreground">
                        Apply
                      </Link>
                    </SheetClose>
                  </div>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-[7.5rem_minmax(0,1fr)]">
                  <nav className="overflow-y-auto border-r border-border bg-muted/30">
                    {mobileFilterTabs.map((tab) => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex w-full flex-col items-center justify-center gap-2 border-b border-border/60 px-2 py-4 text-center text-[11px] uppercase tracking-wide transition-colors ${
                          activeTab === tab.id ? "bg-background text-primary" : "text-foreground/70"
                        }`}
                      >
                        <tab.icon className="h-5 w-5" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </nav>

                  <div
                    className={`min-h-0 overflow-y-auto [&>div:first-child]:hidden [&>div[id^='filters-']]:hidden ${activeSectionClass[activeTab] ?? "[&>div#filters-category]:block"}`}
                  >
                    {filterSheetContent}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 gap-2 rounded-none border-input text-sm font-bold uppercase tracking-wide">
                Sort
                <ChevronDown className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
              <SheetHeader>
                <SheetTitle>Sort By</SheetTitle>
                <SheetDescription>Choose one option.</SheetDescription>
              </SheetHeader>
              <div className="mt-4 grid gap-2">
                {sortItems.map((option) => (
                  <Link
                    key={option.label}
                    href={option.href}
                    className={`rounded-md border px-3 py-2 text-sm font-medium ${
                      option.selected ? "border-primary bg-primary text-primary-foreground" : "border-input text-foreground/80"
                    }`}
                  >
                    {option.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
