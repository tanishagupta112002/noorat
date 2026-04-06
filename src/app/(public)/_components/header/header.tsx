"use client";

import { Grid2x2, Home, Package, Sparkles, Zap } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NavLinks } from "./nav-links";
import Search from "./search";
import MobileMenu from "./mobile-menu";
import Auth from "./auth";
import DeliveryLocationStrip from "./delivery-location-strip";
import { SameDayDeliveryButton } from "@/app/(public)/designer-studios/_components/delivery within 24 hrs";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const mobileBottomNavItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/designer-studios/nearby",
      label: "Same Day Delivery",
      icon: Zap,
      active: pathname === "/designer-studios/nearby",
    },
    {
      href: "/custom-requests",
      label: "AI Try-On",
      icon: Sparkles,
      active: pathname === "/custom-requests" || pathname.startsWith("/custom-requests/"),
    },
    {
      href: "/orders",
      label: "My Orders",
      icon: Package,
      active: pathname === "/orders" || pathname.startsWith("/orders/"),
    },
  ] as const;

  const mobileTabClass = (active: boolean) =>
    active
      ? "text-primary border-b-2 border-primary pb-1"
      : "pb-1 text-slate-800";

  // Hide mobile top+bottom header on rentals routes (main + sub-pages)
  const isRentalsRoute = pathname === "/rentals" || pathname.startsWith("/rentals/");

  return (
    <>
      <header className="sticky top-0 z-200 w-full bg-white backdrop-blur-md border-b">
        <div className="w-full">
          {/* MOBILE: Myntra-like compact header — hidden on rentals routes */}
          <div className={`lg:hidden border-b border-gray-200 bg-white text-foreground${isRentalsRoute ? " hidden" : ""}`}>
            <div className="px-3 pt-2 pb-2">
              <div className="min-w-0 overflow-hidden">
                <DeliveryLocationStrip />
              </div>
            </div>

            <div className="px-3 pb-2 flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <Search mobileLogoSrc="/images/image.png" />
              </div>
              <Auth />
            </div>

            <div className="px-3 h-10 border-t border-gray-200 flex items-center justify-between text-[13px] font-semibold text-slate-800">
              <Link href="/rentals" className={mobileTabClass(pathname === "/rentals")}>All</Link>
              <Link
                href="/rentals/western"
                className={mobileTabClass(pathname === "/rentals/western")}
              >
                Western
              </Link>
              <Link href="/rentals/ethnic" className={mobileTabClass(pathname === "/rentals/ethnic")}>
                Traditional
              </Link>
              <Link href="/rentals/bridal" className={mobileTabClass(pathname === "/rentals/bridal")}>
                Bridal
              </Link>
              <div className="flex items-center gap-1.5">
                <MobileMenu />
              </div>
            </div>
          </div>

          {/* TOP ROW: Search + Location + 24hr Button */}
          <div className="relative hidden lg:block w-full bg-foreground/90 py-1.5 border-b border-border/30">
            <div className="w-full px-0">
              {/* Desktop: 24hr | Search(center) | Location */}
              <div className="hidden px-20 pl-16 py-2 lg:grid grid-cols-[auto_minmax(520px,720px)_auto] items-center gap-8">
                <div className="flex justify-start">
                  <SameDayDeliveryButton />
                </div>
                <div className="flex justify-center">
                  <Search />
                </div>
                <div className="flex justify-end">
                  <DeliveryLocationStrip />
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ROW: Logo + Nav + Auth */}
          <div className="relative w-full border-b border-gray-100">
            <div className="w-full px-3 lg:px-20">
              {/* Desktop: Logo + Nav + Auth */}
              <div className="hidden lg:flex -ml-5 items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <Logo />
                  <NavLinks />
                </div>
                <Auth />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`fixed inset-x-0 bottom-0 z-220 border-t border-rose-100 bg-white/95 backdrop-blur-sm lg:hidden${isRentalsRoute ? " hidden" : ""}`}>
        <div className="grid grid-cols-4 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {mobileBottomNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-1 text-center"
              >
                <Icon
                  className={item.active ? "h-5 w-5 text-primary" : "h-5 w-5 text-slate-700"}
                />
                <span
                  className={item.active
                    ? "text-[9px] font-semibold text-primary"
                    : "text-[9px] font-medium text-slate-700"}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}