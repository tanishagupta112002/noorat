"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/ui/logo";
import { useSession } from "@/hooks/user-session";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  UserRound,
  Mail,
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useSession();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push("/auth");
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed. Try again.");
    }
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const navItems = [
    { href: "/orders", label: "My Orders", tag: "Orders", icon: Package },
    { href: "/profile", label: "Profile Information", tag: "Account", icon: UserRound },
    { href: "/wishlist", label: "My Wishlist", tag: "Account", icon: Heart },
    { href: "/cart", label: "My Cart", tag: "Account", icon: ShoppingCart },
    { href: "/settings", label: "Account Settings", tag: "Payments", icon: Settings },
  ];

  const groupedNav = navItems.reduce<Record<string, typeof navItems>>((groups, item) => {
    if (!groups[item.tag]) {
      groups[item.tag] = [];
    }

    groups[item.tag].push(item);
    return groups;
  }, {});

  const userName = session?.user?.name?.trim() || "noorat User";
  const userInitial = userName.charAt(0).toUpperCase();
  const userEmail = session?.user?.email ?? "";

  const isHubPage = pathname === "/account";
  const currentPage = navItems.find((item) => isActive(item.href));
  const pageTitle = currentPage?.label ?? "My Account";

  // Desktop: /account has no content, redirect to /profile
  useEffect(() => {
    if (isHubPage && window.innerWidth >= 1024) {
      router.replace("/profile");
    }
  }, [isHubPage, router]);

  const sidebarContent = (
    <>
      <div className="rounded-sm border border-[#e6e6e6] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-base font-semibold text-primary-foreground">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Hello,</p>
            <p className="truncate text-base font-semibold text-foreground">{userName}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-sm border border-[#e6e6e6] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        {Object.entries(groupedNav).map(([group, items], index) => (
          <div key={group} className={index === 0 ? "" : "border-t border-[#f0f0f0]"}>
            <div className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group}</p>
            </div>
            <nav className="pb-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between border-l-4 px-5 py-3 text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "border-l-primary bg-primary/10 text-primary"
                      : "border-l-transparent text-foreground hover:bg-[#fafafa]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="rounded-sm border border-[#e6e6e6] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-between rounded-sm px-3 py-3 text-left text-sm font-medium text-foreground transition hover:bg-[#fafafa]"
        >
          <span className="flex items-center gap-3">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-foreground">
      {/* ── Desktop header ── */}
      <div className="hidden lg:block border border-foreground/10 p-2 bg-background">
        <div className="mx-auto flex w-full max-w-[1480px] items-center justify-center px-4">
<Link href="/" className="group inline-flex shrink-0">
      <div className="inline-flex shrink-0 items-center  gap-0 whitespace-nowrap">
        <Image
          src="/images/logo.png"
          alt="Noorat Logo"
          width={160}
          height={60}
          className="block shrink-0 object-contain h-20 w-auto"
        />
        
      </div>
    </Link>        </div>
      </div>

      {/* ══ MOBILE: Hub page (/account) ══ */}
      {isHubPage && (
        <div className="lg:hidden min-h-screen bg-[#f8f8f8]">
          {/* Hub header — back arrow goes to home */}
          <div className="sticky top-0 z-40 bg-white border-b border-[#e6e6e6] px-4 py-4 shadow-sm flex items-center gap-3">
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition hover:bg-[#f5f5f5]"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Profile</h1>
          </div>

          {/* User info card */}
          <div className="bg-white px-4 py-5 flex items-center gap-4 border-b border-[#f0f0f0]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-xl font-bold text-primary-foreground shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground truncate">{userName}</p>
              {userEmail && (
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {userEmail}
                </p>
              )}
            </div>
          </div>

          {/* Nav groups */}
          <div className="mt-3 space-y-3 px-0">
            {Object.entries(groupedNav).map(([group, items]) => (
              <div key={group} className="bg-white">
                <p className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {group}
                </p>
                {items.map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-4 text-sm font-medium text-foreground active:bg-[#f5f5f5] ${
                      i !== items.length - 1 ? "border-b border-[#f5f5f5]" : ""
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <span>{item.label}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ))}

            {/* Logout row */}
            <div className="bg-white mb-8">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-between px-4 py-4 text-sm font-medium text-foreground active:bg-[#f5f5f5]"
              >
                <span className="flex items-center gap-3">
                  <LogOut className="h-5 w-5 text-muted-foreground" />
                  <span>Logout</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MOBILE: Sub-page ══ */}
      {!isHubPage && (
        <div className="lg:hidden">
          {/* Sub-page header with back arrow */}
          <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-[#e6e6e6] bg-white px-4 py-3.5 shadow-sm">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/account");
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition hover:bg-[#f5f5f5]"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
          </div>
          <main className="min-w-0 bg-white p-4 sm:p-5">
            {children}
          </main>
        </div>
      )}

      {/* ══ DESKTOP: Sidebar + content grid ══ */}
      <div className="hidden lg:block">
        <div className="mx-auto w-full max-w-[1480px] px-4 py-6 xl:px-5">
          <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-6">
              {sidebarContent}
            </aside>
            <main className="min-w-0 rounded-sm border border-[#e6e6e6] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)] xl:p-7">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}