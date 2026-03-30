"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/order-assign", label: "Order Assign" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/delivery-agents", label: "Delivery Agents" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href + "/"));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "border-foreground bg-foreground text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
