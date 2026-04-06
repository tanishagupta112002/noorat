"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, ChevronDown, type LucideIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NAV_ITEMS, type NavChild, type NavItem } from "./nav-config"
import Image from "next/image"
import { cn } from "@/lib/utils"

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close menu on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

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
              href={item.href}
              childrenItems={item.children || []}
              pathname={pathname}
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
  href,
  childrenItems,
  pathname,
  onClose,
}: {
  label: string
  icon?: LucideIcon
  href?: string
  childrenItems: NavChild[]
  pathname: string
  onClose: () => void
}) {
  // Auto-expand if any child matches current path
  const hasActiveChild = childrenItems.some(
    (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
  )
  const [open, setOpen] = useState(hasActiveChild)

  useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  if (childrenItems.length === 0) {
    // Simple link, no children
    const isActive = pathname === href
    return (
      <div className="px-1">
        <Link
          href={href ?? "/"}
          onClick={onClose}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-4 rounded-lg text-sm font-medium",
            isActive ? "text-primary" : "text-foreground hover:bg-muted"
          )}
        >
          {Icon && <Icon className="h-5 w-5 shrink-0" />}
          {label}
        </Link>
      </div>
    )
  }

  return (
    <div className="px-1">
      {/* Parent button — NEVER highlighted, always plain gray */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between px-3 py-4 rounded-lg text-foreground hover:bg-muted"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 shrink-0 mt-0.5" />}
          <span className="font-medium">{label}</span>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="pl-8 pb-3 space-y-1">
          {childrenItems.map((child) => {
            // Always render as flat link, even if child has sub-children
            const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`)

            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between py-2 text-sm",
                  isChildActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
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