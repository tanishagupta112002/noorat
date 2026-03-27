"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, ChevronDown, type LucideIcon } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NAV_ITEMS, type NavChild, type NavItem } from "./nav-config"
import Image from "next/image"
import link from "next/link"
export default function MobileMenu() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost">
          <Menu />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[85vw] z-9999 max-w-60 p-0 bg-background flex flex-col"
      >
        {/* HEADER */}
        <div className="border-b px-5 pt-5 -pb-5">
          <Link href="/" className="group inline-flex shrink-0">
                <div className="inline-flex shrink-0 items-center gap-0 whitespace-nowrap">
                  <Image
                    src="/images/logo.png"
                    alt="Noorat Logo"
                    width={160}
                    height={60}
                    className="block shrink-0 object-cover -mb-2 h-10  w-auto"
                  />
                  
                </div>
              </Link>     
        </div>

        {/* MENU */}
        <div className="flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item: NavItem) => (
            <MobileCollapsible
              key={item.label}
              label={item.label}
              icon={item.icon}
              childrenItems={item.children || []}
              onClose={() => setOpen(false)}
            />
          ))}
        </div>

        

        {/* AUTH */}
        <div className="border-t px-5 py-5 space-y-3">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>

          <Button className="w-full" asChild>
            <Link href="/sign-up">Create Account</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MobileCollapsible({
  label,
  icon: Icon,
  childrenItems,
  onClose,
}: {
  label: string
  icon?: LucideIcon
  childrenItems: NavChild[]
  onClose: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="px-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between px-3 py-4 rounded-lg hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 shrink-0 mt-0.5" />}
          <span className="font-medium">{label}</span>
        </div>

        {childrenItems.length > 0 && (
          <ChevronDown
            className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && childrenItems.length > 0 && (
        <div className="pl-8 pb-3 space-y-1">
          {childrenItems.map((child) => {
            if (child.children) {
              return (
                <MobileCollapsible
                  key={child.label}
                  label={child.label}
                  childrenItems={child.children}
                  onClose={onClose}
                />
              )
            }

            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onClose}
                className="flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {child.label}

                {child.badge && (
                  <Badge variant="secondary">{child.badge}</Badge>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}