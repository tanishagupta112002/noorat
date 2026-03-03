// src/components/layout/nav-links.tsx
"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  homeDropdown,
  rentalsDropdown,
  customDropdown,
  exploreDropdown,
} from "./nav-config";

type NavLinksProps = {
  isActive: (href: string) => boolean;
};

export function NavLinks({ isActive }: NavLinksProps) {
  return (
    <NavigationMenu className="hidden md:flex flex-1 justify-center mx-8 ">
      <NavigationMenuList className="gap-1 lg:gap-4">
        {/* Home */}
        <NavigationMenuItem>
          <NavigationMenu>
            <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "text-base px-4 py-2")}>
              Home
            </NavigationMenuTrigger>
            <NavigationMenuContent className="origin-top-left min-w-[220px]">
              <ul className="grid gap-1 p-3">
                {homeDropdown.map((item) => (
                  <li key={item.href}>
                    <NavigationMenuLink asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "block select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                          isActive(item.href) && "bg-accent text-accent-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          {item.label}
                          {item.badge && <Badge variant="secondary" className="ml-2 text-xs">{item.badge}</Badge>}
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenu>
        </NavigationMenuItem>

        {/* Rentals */}
        <NavigationMenuItem>
          <NavigationMenu>
            <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "text-base px-4 py-2")}>
              Rentals
            </NavigationMenuTrigger>
            <NavigationMenuContent className="origin-top-left min-w-[700px] lg:min-w-[900px]">
              <div className="grid grid-cols-3 gap-6 p-6">
                {rentalsDropdown.map((group) => (
                  <div key={group.category} className="space-y-3">
                    <h4 className="font-medium text-base">{group.category}</h4>
                    <ul className="space-y-1.5">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "block text-sm text-muted-foreground hover:text-foreground transition-colors",
                              isActive(item.href) && "text-foreground font-medium"
                            )}
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenu>
        </NavigationMenuItem>

        {/* Custom */}
        <NavigationMenuItem>
          <NavigationMenu>
            <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "text-base px-4 py-2")}>
              Custom
            </NavigationMenuTrigger>
            <NavigationMenuContent className="origin-top-left min-w-[280px]">
              <ul className="grid gap-1 p-3">
                {customDropdown.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        isActive(item.href) && "bg-accent text-accent-foreground"
                      )}
                    >
                      {item.label}
                      {item.badge && <Badge variant="secondary" className="ml-2 text-xs">{item.badge}</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenu>
        </NavigationMenuItem>

        {/* Explore */}
        <NavigationMenuItem>
          <NavigationMenu>
            <NavigationMenuTrigger className={cn(navigationMenuTriggerStyle(), "text-base px-4 py-2")}>
              Explore
            </NavigationMenuTrigger>
            <NavigationMenuContent className="origin-top-left min-w-[260px]">
              <ul className="grid gap-1 p-3">
                {exploreDropdown.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block select-none rounded-md px-3 py-2 text-sm leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        isActive(item.href) && "bg-accent text-accent-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenu>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}