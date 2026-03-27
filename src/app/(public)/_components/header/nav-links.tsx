"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, isActiveNavItem } from "./nav-config";

const CLOSE_DELAY_MS = 150;

export function NavLinks() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [openLabel, setOpenLabel] = React.useState<string | null>(null);
  const closeTimer = React.useRef<NodeJS.Timeout | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Route change pe menu band kar do
  React.useEffect(() => {
    setOpenLabel(null);
  }, [pathname, searchParams]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpenLabel(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenLabel(null);
    };

    window.addEventListener("pointerdown", handleClickOutside);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("pointerdown", handleClickOutside);
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const clearClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpenLabel(null), CLOSE_DELAY_MS);
  };

  const open = (label: string) => {
    clearClose();
    setOpenLabel(label);
  };

  const activeItem = React.useMemo(
    () => NAV_ITEMS.find((i) => i.label === openLabel && i.children?.length),
    [openLabel],
  );

  return (
    <div
      ref={containerRef}
      className="relative hidden lg:flex items-center"
      onMouseEnter={clearClose}
      onMouseLeave={scheduleClose}
    >
      <ul className="flex items-center gap-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = isActiveNavItem(pathname, item);
          const isOpen = openLabel === item.label;
          const hasChildren = !!item.children?.length;

          const linkClass = cn(
            "relative flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors",
            isOpen || isActive
              ? "text-primary bg-primary/20"
              : "text-gray-700 hover:text-primary hover:bg-primary/10",
          );

          if (!hasChildren) {
            return (
              <li key={item.label}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                  {(isOpen || isActive) && (
                    <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              </li>
            );
          }

          return (
            <li key={item.label}>
              <button
                type="button"
                className={linkClass}
                onMouseEnter={() => open(item.label)}
                onFocus={() => open(item.label)}
                onClick={() => setOpenLabel(isOpen ? null : item.label)}
                aria-expanded={isOpen}
              >
                {item.label}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isOpen && "rotate-180",
                  )}
                />
                {(isOpen || isActive) && (
                  <span className="absolute -bottom-1 left-3 right-3 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    
      {activeItem && (
        <div
          className="
      fixed inset-x-0 top-full pt-1.5 lg:pt-2
      pointer-events-auto
    "
          onMouseEnter={clearClose}
          onMouseLeave={scheduleClose}
        >
          {/* Inner wrapper — full viewport width, content center + max readable width */}
          <div
            className="
        relative mx-auto w-full max-w-[min(100vw,1440px)] px-4 sm:px-6 lg:px-8 xl:px-12
        bg-white border-b border-gray-200/70 shadow-2xl
        rounded-b-2xl overflow-hidden
        animate-in fade-in slide-in-from-top-2 duration-200
      "
          >
            <div className="grid grid-cols-12 gap-6 p-6 lg:p-8">
              {/* Left sidebar - category intro */}
              <div className="col-span-12 lg:col-span-3 bg-primary/5 rounded-xl p-6 flex flex-col">
                <div className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">
                  {activeItem.label}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed flex-1">
                  {activeItem.label === "Categories" &&
                    "Trendy outfits on rent – western, ethnic, party & more"}
                  {activeItem.label === "AI Try-On" &&
                    "Design your own perfect outfit with AI help"}
                  {activeItem.label === "Nearby Designers" &&
                    "Find top local boutiques for lehenga & saree rentals"}
                  {activeItem.label === "Explore" &&
                    "Everything you need to know about renting fashion"}
                    {activeItem.label === "Become a Provider" &&
                    "Sign up as rental shop/ boutique designer and rent your outfits to earn extra income"}
                </p>
                <Link
                  href={activeItem.href}
                  className="mt-4 text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"
                  onClick={() => setOpenLabel(null)}
                >
                  View All →
                </Link>
              </div>

              {/* Right grid - links */}
              <div className="col-span-12 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(activeItem.children ?? []).map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setOpenLabel(null)}
                    className={cn(
                      "group rounded-xl border border-gray-100 p-5 hover:border-primary hover:bg-primary/10 transition-colors",
                      pathname.startsWith(child.href) &&
                        "border-primary bg-primary/20",
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-gray-900 group-hover:text-primary">
                        {child.label}
                      </span>
                      {child.badge && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {child.badge}
                        </span>
                      )}
                    </div>
                    {child.description && (
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {child.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
