"use client";

import { Logo } from "@/components/ui/logo";
import { NavLinks } from "./nav-links";
import Search from "./search";
import MobileMenu from "./mobile-menu";
import Auth from "./auth";
import DeliveryLocationStrip from "./delivery-location-strip";

export default function Header() {
  return (
    <header className="sticky top-0 z-200 w-full bg-white backdrop-blur-md border-b">
      <div className="w-full">

        {/* Top section */}
        <div className="relative flex flex-col gap-2 items-start lg:items-center lg:gap-1 px-4 lg:px-5 py-2 max-w-6xl mx-auto overflow-visible">

          <div className="hidden w-full items-center justify-end lg:flex">
            <DeliveryLocationStrip />
          </div>

          {/* Row for logo + mobile menu + auth */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="lg:hidden">
              <MobileMenu />
            </div>
            <Logo />

            {/* Mobile right side */}
            <div className="flex items-center gap-2 lg:hidden">
              <Auth />
              
            </div>

            {/* Desktop auth (same as before) */}
            <div className="hidden lg:flex absolute top-4 -right-40">
              <Auth />
            </div>

          </div>

          {/* Search */}
          <div className="w-full max-w-4xl mx-auto">
            <Search />
          </div>

          {/* Mobile delivery location strip — below search */}
          <div className="w-full lg:hidden">
            <DeliveryLocationStrip />
          </div>

        </div>

        {/* Desktop nav */}
        <div className="relative hidden lg:block">
          <div className="max-w-6xl mx-auto px-5 flex items-center justify-center">
            <NavLinks />
          </div>
        </div>

      </div>
    </header>
  );
}