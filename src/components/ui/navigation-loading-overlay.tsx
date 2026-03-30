"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";

import { LogoLoader } from "@/components/ui/logo-loader";

function isInternalLink(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href");
  if (!href) return false;
  if (href.startsWith("#")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;

  const target = anchor.getAttribute("target");
  if (target && target !== "_self") return false;

  return true;
}

export function NavigationLoadingOverlay() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const nextTargetRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !isInternalLink(anchor)) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const current = `${window.location.pathname}${window.location.search}`;
      const next = `${url.pathname}${url.search}`;
      if (current === next) return;

      nextTargetRef.current = next;
      setVisible(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  useEffect(() => {
    const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    if (!nextTargetRef.current) return;
    if (current !== nextTargetRef.current) return;

    const timer = window.setTimeout(() => {
      setVisible(false);
      nextTargetRef.current = null;
    }, 120);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  if (!mounted || !visible || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-12000 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
      <div className="rounded-2xl border border-white/40 bg-background/90 px-10 py-8 shadow-2xl">
        <LogoLoader label="Loading" size="sm" />
      </div>
    </div>,
    document.body
  );
}