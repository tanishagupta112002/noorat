// src/components/layout/mobile-menu.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import {
  homeDropdown,
  rentalsDropdown,
  customDropdown,
  exploreDropdown,
} from "./nav-config";

export function MobileMenu() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (href: string) =>
    window.location.pathname === href ||
    window.location.pathname.startsWith(href + "/") ||
    window.location.pathname.startsWith(href);

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon" aria-label="Open navigation menu">
          <Menu className="h-6 w-6 stroke-[1.5px]" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[85vw] max-w-sm p-0 border-r bg-background [&>button]:hidden"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-6 py-5">
            <Link href="/" className="flex items-center gap-2.5" onClick={() => setSheetOpen(false)}>
              <Image
                src="/images/logo.png"
                alt="TaniTwirl Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-2xl font-bold tracking-tight text-foreground">
                TaniTwirl
              </span>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSheetOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-6 w-6 stroke-[1.5px]" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-8">
            {/* Home collapsible */}
            <div className="mb-6">
              {(() => {
                const [isOpen, setIsOpen] = useState(false);
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className="flex w-full items-center justify-between py-4 px-4 text-base font-semibold text-foreground hover:bg-accent/50 rounded-lg transition-colors uppercase tracking-wide"
                    >
                      Home
                      <ChevronDown className={cn("h-5 w-5 stroke-[1.5px] transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {isOpen && (
                      <div className="mt-2 space-y-1 pl-4">
                        {homeDropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center justify-between py-3 px-4 rounded-lg text-sm transition-colors hover:bg-accent/70",
                              isActive(item.href) && "bg-accent/50 font-medium text-foreground"
                            )}
                            onClick={() => setSheetOpen(false)}
                          >
                            {item.label}
                            {item.badge && <Badge variant="secondary" className="text-xs">{item.badge}</Badge>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Rentals collapsible */}
            <div className="mb-6">
              {(() => {
                const [isOpen, setIsOpen] = useState(false);
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className="flex w-full items-center justify-between py-4 px-4 text-base font-semibold text-foreground hover:bg-accent/50 rounded-lg transition-colors uppercase tracking-wide"
                    >
                      Rentals
                      <ChevronDown className={cn("h-5 w-5 stroke-[1.5px] transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {isOpen && (
                      <div className="mt-3 space-y-6 pl-2">
                        {rentalsDropdown.map((group) => (
                          <div key={group.category}>
                            <p className="mb-2 px-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {group.category}
                            </p>
                            <div className="space-y-1">
                              {group.items.map((item) => (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  className={cn(
                                    "block py-3 px-5 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground",
                                    isActive(item.href) && "bg-accent/50 text-foreground font-medium"
                                  )}
                                  onClick={() => setSheetOpen(false)}
                                >
                                  {item.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Custom collapsible */}
            <div className="mb-6">
              {(() => {
                const [isOpen, setIsOpen] = useState(false);
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className="flex w-full items-center justify-between py-4 px-4 text-base font-semibold text-foreground hover:bg-accent/50 rounded-lg transition-colors uppercase tracking-wide"
                    >
                      Custom
                      <ChevronDown className={cn("h-5 w-5 stroke-[1.5px] transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {isOpen && (
                      <div className="mt-2 space-y-1 pl-4">
                        {customDropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "flex items-center justify-between py-3 px-4 rounded-lg text-sm transition-colors hover:bg-accent/70",
                              isActive(item.href) && "bg-accent/50 font-medium text-foreground"
                            )}
                            onClick={() => setSheetOpen(false)}
                          >
                            {item.label}
                            {item.badge && <Badge variant="secondary" className="text-xs">{item.badge}</Badge>}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Explore collapsible */}
            <div className="mb-6">
              {(() => {
                const [isOpen, setIsOpen] = useState(false);
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsOpen(!isOpen)}
                      className="flex w-full items-center justify-between py-4 px-4 text-base font-semibold text-foreground hover:bg-accent/50 rounded-lg transition-colors uppercase tracking-wide"
                    >
                      Explore
                      <ChevronDown className={cn("h-5 w-5 stroke-[1.5px] transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {isOpen && (
                      <div className="mt-2 space-y-1 pl-4">
                        {exploreDropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              "block py-3 px-4 rounded-lg text-sm text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground",
                              isActive(item.href) && "bg-accent/50 text-foreground font-medium"
                            )}
                            onClick={() => setSheetOpen(false)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </nav>

          <div className="border-t px-6 py-8 mt-auto space-y-4 bg-muted/30">
            <Button variant="outline" className="w-full justify-center" asChild onClick={() => setSheetOpen(false)}>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="w-full justify-center" asChild onClick={() => setSheetOpen(false)}>
              <Link href="/sign-up">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}