// src/app/(public)/_components/header/auth.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const CART_COUNT_CACHE_TTL_MS = 15_000;
const PROVIDER_ACCESS_CACHE_TTL_MS = 5 * 60_000;

type TimedCache<T> = {
  value: T;
  expiresAt: number;
};

function getCacheKey(prefix: string, userId: string) {
  return `${prefix}:${userId}`;
}

function readTimedCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as TimedCache<T>;
    if (!parsed?.expiresAt || Date.now() > parsed.expiresAt) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

function writeTimedCache<T>(key: string, value: T, ttlMs: number) {
  if (typeof window === "undefined") return;

  try {
    const payload: TimedCache<T> = {
      value,
      expiresAt: Date.now() + ttlMs,
    };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage failures.
  }
}

export default function Auth() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [providerHref, setProviderHref] = useState("/become-a-provider/onboarding");
  const [canAccessProviderMode, setCanAccessProviderMode] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId) {
      setCartCount(0);
      return;
    }

    const cacheKey = getCacheKey("tt_cart_count", userId);
    const cachedCount = readTimedCache<number>(cacheKey);
    if (typeof cachedCount === "number") {
      setCartCount(cachedCount);
    }

    let active = true;

    async function refreshCartCount() {
      try {
        const response = await fetch("/api/cart/count", { cache: "no-store" });
        const data = (await response.json()) as { count?: number };
        const count = data.count ?? 0;

        if (!active) return;

        setCartCount(count);
        writeTimedCache(cacheKey, count, CART_COUNT_CACHE_TTL_MS);
      } catch {
        if (!active) return;
        setCartCount(0);
      }
    }

    if (cachedCount === null) {
      void refreshCartCount();
    }

    const handleCartUpdated = () => {
      void refreshCartCount();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCartCount();
      }
    };

    window.addEventListener("cart:updated", handleCartUpdated);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener("cart:updated", handleCartUpdated);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;

    if (!userId) {
      setCanAccessProviderMode(false);
      setProviderHref("/become-a-provider/onboarding");
      return;
    }

    const cacheKey = getCacheKey("tt_provider_access", userId);
    const cached = readTimedCache<{ canAccessProviderMode: boolean; providerHref: string }>(cacheKey);

    if (cached) {
      setCanAccessProviderMode(Boolean(cached.canAccessProviderMode));
      setProviderHref(cached.providerHref || "/become-a-provider/onboarding");
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
        writeTimedCache(
          cacheKey,
          {
            canAccessProviderMode: Boolean(data.canAccessProviderMode),
            providerHref: data.providerHref || "/become-a-provider/onboarding",
          },
          PROVIDER_ACCESS_CACHE_TTL_MS,
        );
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
  }, [session?.user?.id]);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
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