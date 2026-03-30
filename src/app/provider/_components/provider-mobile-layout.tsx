"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
  ChevronRight,
  LayoutDashboard,
  PackagePlus,
  ShoppingBag,
  User,
  Wallet,
  Star,
  BadgeIndianRupee,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Boxes;
};

const navItems: NavItem[] = [
  { href: "/provider/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/provider/profile", label: "Profile", icon: User },
  { href: "/provider/inventory", label: "My Store", icon: Boxes },
  { href: "/provider/add-stock", label: "Add New Stock", icon: PackagePlus },
  { href: "/provider/orders", label: "Orders", icon: ShoppingBag },
  { href: "/provider/sells", label: "Sells", icon: BadgeIndianRupee },
  { href: "/provider/payments", label: "Payment Summary", icon: Wallet },
  { href: "/provider/reviews", label: "Reviews", icon: Star },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ProviderMobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHub = pathname === "/provider/menu";
  const isDashboardPage = pathname === "/provider/dashboard";
  const currentPage = navItems.find((item) => isActive(pathname, item.href));
  const pageTitle = currentPage?.label ?? "Provider";

  if (isHub) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#f8f8f8] pb-[max(env(safe-area-inset-bottom),1rem)]">
        {/* Hub header */}
        <div className="sticky top-0 z-40 bg-white border-b border-[#e6e6e6] px-4 py-4 shadow-sm flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition hover:bg-[#f5f5f5]"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Provider Dashboard</h1>
        </div>

        {/* Nav list */}
        <div className="mt-3 space-y-3 px-2">
          {navItems.map((item, i) => {
            const sectionItems = navItems;
            const isLast = i === sectionItems.length - 1;
            return (
              <div key={item.href} className="overflow-hidden rounded-xl bg-white">
                <Link
                  href={item.href}
                  className={`flex items-center justify-between bg-white px-4 py-4 text-sm font-medium text-foreground active:bg-[#f5f5f5] ${
                    !isLast ? "border-b border-[#f5f5f5]" : ""
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span>{item.label}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Sub-page
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f8f8] pb-[max(env(safe-area-inset-bottom),1rem)]">
      {/* Sub-page header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-[#e6e6e6] bg-white px-4 py-3.5 shadow-sm">
        <button
          type="button"
          onClick={() => {
            if (isDashboardPage) {
              router.replace("/");
            } else if (window.history.length > 1) {
              router.back();
            } else {
              router.replace("/provider/menu");
            }
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition hover:bg-[#f5f5f5]"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
      </div>
      <main className="bg-white px-4 py-4 sm:px-5 sm:py-5">{children}</main>
    </div>
  );
}
