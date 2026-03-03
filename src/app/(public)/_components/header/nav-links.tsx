// src/components/layout/nav-links.tsx
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type NavLinksProps = {
  isActive: (href: string) => boolean;
};

const navItems = [
  { href: "/", label: "HOME" },
  { href: "/rentals", label: "RENTALS" },
  { href: "/custom-requests", label: "CUSTOM" },
  { href: "/how-it-works", label: "EXPLORE" },
];

export function NavLinks({ isActive }: NavLinksProps) {
  return (
    <nav className="flex items-center justify-center py-4" aria-label="Main navigation">
      <ul className="flex items-center gap-8">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "text-sm font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors relative pb-1",
                "after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-foreground after:transition-all hover:after:w-full",
                isActive(item.href) && "text-foreground after:w-full"
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}