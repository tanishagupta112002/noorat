// src/app/(public)/_components/header/auth.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Heart, LogOut, ShoppingBag, ShoppingCart, Store, User } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Auth() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [providerHref, setProviderHref] = useState("/become-a-provider/onboarding");
  const [canAccessProviderMode, setCanAccessProviderMode] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Fetch cart count whenever user is logged in or navigates
  useEffect(() => {
    if (!session?.user) {
      setCartCount(0);
      return;
    }
    fetch("/api/cart/count")
      .then((r) => r.json())
      .then((d: { count?: number }) => setCartCount(d.count ?? 0))
      .catch(() => setCartCount(0));
  }, [session?.user, pathname]);

  useEffect(() => {
    if (!session?.user) {
      return;
    }

    let active = true;

    async function loadProviderAccess() {
      try {
        const response = await fetch("/api/provider/access", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          canAccessProviderMode?: boolean;
          providerHref?: string;
        };

        if (!active) {
          return;
        }

        setCanAccessProviderMode(Boolean(data.canAccessProviderMode));
        setProviderHref(data.providerHref || "/become-a-provider/onboarding");
      } catch {
        if (!active) {
          return;
        }

        setCanAccessProviderMode(false);
        setProviderHref("/become-a-provider/onboarding");
      }
    }

    void loadProviderAccess();

    return () => {
      active = false;
    };
  }, [session?.user]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  if (isPending) {
    return (
      <div className="flex items-center gap-2 lg:gap-4 opacity-50 pointer-events-none">
        <Heart className="w-5 h-5" />
        <ShoppingCart className="w-5 h-5" />
        <User className="w-5 h-5" />
      </div>
    );
  }

  const isLoggedIn = !!session?.user;

  const profileIcon = (
    <User className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
  );

  return (
    <div className="flex items-center gap-2 lg:gap-4">
      {/* Wishlist */}
      <Link href="/wishlist" className="relative">
        <Heart className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
      </Link>

      {/* Cart */}
      <Link href="/cart" className="relative">
        <ShoppingCart className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground leading-none">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        )}
      </Link>

      {!isLoggedIn ? (
        <Link href="/auth">
          {profileIcon}
        </Link>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Open profile menu"
              className="rounded-full outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {profileIcon}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 z-999">
            <DropdownMenuLabel className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">{session.user.name || "My account"}</p>
              <p className="text-xs font-normal text-muted-foreground">{session.user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
              <Link href="/account">
                <ShoppingBag className="h-4 w-4" />
                Customer Mode
              </Link>
            </DropdownMenuItem>
            {canAccessProviderMode ? (
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
                <Link href={providerHref}>
                  <Store className="h-4 w-4" />
                  Provider Mode
                </Link>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2">
                <Link href={providerHref}>
                  <Store className="h-4 w-4" />
                  Become a Provider
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="rounded-xl px-3 py-2 text-red-600 focus:text-red-600">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}