"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

type FilterMenuItem = {
  key: string;
  label: string;
  count: number;
  href: string;
  selected: boolean;
  swatchClass?: string;
  searchTerms?: string[];
};

type SortItem = {
  label: string;
  href: string;
  selected: boolean;
};

type DesktopFilterMenuProps = {
  title: string;
  items: FilterMenuItem[];
  clearHref: string;
  showColorSwatch?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
};

function FilterColumn({
  title,
  items,
  clearHref,
  showColorSwatch = false,
  searchable = false,
  searchPlaceholder,
}: DesktopFilterMenuProps) {
  const hasActiveSelection = items.some((item) => item.selected);
  const [query, setQuery] = useState("");
  const filteredItems = query
    ? items.filter((item) => {
        const haystack = [item.label, ...(item.searchTerms ?? [])].join(" ").toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
    : items;

  return (
    <div className="min-w-50 border-r border-border/80 bg-white px-3 py-3 last:border-r-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">By {title}</p>
        <Link
          href={clearHref}
          aria-label={`Clear ${title} filters`}
          className={`rounded p-1 transition-colors ${
            hasActiveSelection ? "text-foreground hover:bg-muted" : "pointer-events-none text-muted-foreground/50"
          }`}
        >
          <X className="h-4 w-4" />
        </Link>
      </div>
      {searchable ? (
        <div className="mb-2 flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}`}
            className="w-full border-0 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      ) : null}
      <div className="max-h-52 space-y-0.5 overflow-y-auto pr-1 [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-card [&::-webkit-scrollbar-thumb]:bg-border/80 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
        {filteredItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex items-center justify-between gap-2 rounded-sm px-2 py-1 text-xs text-foreground/90 transition-colors hover:bg-accent/50"
          >
            <span className="flex items-center gap-2 pr-2">
              {showColorSwatch ? <span className={`h-4 w-4 shrink-0 rounded-sm ${item.swatchClass}`} /> : null}
              <span className="whitespace-nowrap leading-4.5">{item.label}</span>
            </span>
            <input
              type="checkbox"
              readOnly
              checked={item.selected}
              className="pointer-events-none h-4 w-4 shrink-0 rounded border-border bg-background accent-primary shadow-sm"
            />
          </Link>
        ))}
        {filteredItems.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">No {title.toLowerCase()} found for &quot;{query}&quot;</p>
        ) : null}
      </div>
    </div>
  );
}

export function RentalsDesktopFilterBar({
  categoryItems,
  boutiqueItems,
  sizeItems,
  priceItems,
  colorItems,
  cityItems,
  clearCategoryHref,
  clearBoutiqueHref,
  clearSizeHref,
  clearPriceHref,
  clearColorHref,
  clearCityHref,
  applyHref,
  sortItems,
  selectedSort,
}: {
  categoryItems: FilterMenuItem[];
  boutiqueItems: FilterMenuItem[];
  sizeItems: FilterMenuItem[];
  priceItems: FilterMenuItem[];
  colorItems: FilterMenuItem[];
  cityItems: FilterMenuItem[];
  clearCategoryHref: string;
  clearBoutiqueHref: string;
  clearSizeHref: string;
  clearPriceHref: string;
  clearColorHref: string;
  clearCityHref: string;
  applyHref: string;
  sortItems: SortItem[];
  selectedSort: string;
}) {
  const filterPanelRef = useRef<HTMLDetailsElement>(null);
  const sortPanelRef = useRef<HTMLDetailsElement>(null);

  function closeFilterPanel() {
    if (filterPanelRef.current) {
      filterPanelRef.current.open = false;
    }
  }

  function closeSortPanel() {
    if (sortPanelRef.current) {
      sortPanelRef.current.open = false;
    }
  }

  return (
    <div className="relative hidden items-center justify-between gap-5 lg:flex">
      <details ref={filterPanelRef} name="top-filter-menu" className="group static">
        <summary className="flex h-11 list-none cursor-pointer items-center gap-2 rounded-md border border-input bg-white px-4 text-sm font-semibold text-foreground transition-colors group-open:border-primary/30 group-open:bg-primary/10 group-open:text-primary">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary" />
        </summary>

        <div className="absolute left-1/2 top-full z-30 mt-2 hidden w-[98vw] max-w-440 -translate-x-1/2 overflow-x-auto overflow-y-hidden rounded-2xl border border-border bg-white shadow-2xl group-open:block">
          <div className="grid w-full auto-cols-[minmax(200px,1fr)] grid-flow-col">
            <FilterColumn title="Category" items={categoryItems} clearHref={clearCategoryHref} searchable searchPlaceholder="Search looks" />
            <FilterColumn title="Price" items={priceItems} clearHref={clearPriceHref} searchable searchPlaceholder="budget friendly & premium" />
            <FilterColumn title="Design Studio" items={boutiqueItems} clearHref={clearBoutiqueHref} searchable searchPlaceholder="Search Brands" />
            <FilterColumn title="Size" items={sizeItems} clearHref={clearSizeHref} searchable searchPlaceholder="Search size & fit" />
            <FilterColumn title="Color" items={colorItems} clearHref={clearColorHref} showColorSwatch searchable searchPlaceholder="Search colors" />
            <FilterColumn title="City" items={cityItems} clearHref={clearCityHref} searchable searchPlaceholder="Search cities" />
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/10 px-4 py-2">
            <button
              type="button"
              onClick={closeFilterPanel}
              className="rounded-md border border-input bg-white px-4 py-1 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              HIDE
            </button>
            <Link
              href={applyHref}
              onClick={closeFilterPanel}
              className="rounded-md bg-foreground px-4 py-1 text-xs font-semibold text-background shadow-sm transition-opacity hover:opacity-90"
            >
              APPLY
            </Link>
          </div>
        </div>
      </details>

      <div className="min-w-55">
        <details ref={sortPanelRef} name="top-sort-menu" className="group relative">
          <summary className="flex h-11 list-none cursor-pointer items-center justify-between rounded-md border border-input bg-white px-4 text-sm font-semibold text-foreground transition-colors group-open:border-primary/30 group-open:bg-primary/10 group-open:text-primary">
            <span>Sort by : {selectedSort}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 group-open:text-primary" />
          </summary>
          <div className="absolute right-0 top-full z-20 mt-1 hidden w-full rounded-md border border-border bg-white p-2 shadow-xl group-open:block">
            {sortItems.map((option) => (
              <Link
                key={option.label}
                href={option.href}
                onClick={closeSortPanel}
                className={`block rounded px-2 py-1.5 text-sm ${
                  option.selected ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
