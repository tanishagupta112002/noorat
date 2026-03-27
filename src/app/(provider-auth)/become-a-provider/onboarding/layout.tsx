// src/app/(provider-auth)/provider/onboarding/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getOnboardingStatus } from "./_actions/onboarding-actions";
import { Logo } from "@/components/ui/logo";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [nextAllowedPath, setNextAllowedPath] = useState("/become-a-provider/onboarding/1_mobile_verification");

  const steps = [
    { name: "Mobile Verification", path: "/become-a-provider/onboarding/1_mobile_verification" },
    { name: "ID Verification", path: "/become-a-provider/onboarding/2_identity_verification" },
    { name: "Store Details", path: "/become-a-provider/onboarding/3_store_details" },
    { name: "Pickup Address", path: "/become-a-provider/onboarding/4_pickup_address" },
    { name: "Bank Account Details", path: "/become-a-provider/onboarding/5_bank_account" },
    { name: "Create First Listing", path: "/become-a-provider/onboarding/6_first_listing" },
  ];

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      const { nextStep } = await getOnboardingStatus();
      if (!active) return;
      setNextAllowedPath(nextStep);
    }

    void loadStatus();

    return () => {
      active = false;
    };
  }, [pathname]);

  const allowedIndex = useMemo(() => {
    if (nextAllowedPath === "/provider/dashboard") {
      return steps.length;
    }
    const idx = steps.findIndex((step) => step.path === nextAllowedPath);
    return idx === -1 ? 0 : idx;
  }, [nextAllowedPath, steps]);

  return (
    <div className="flex h-full min-h-screen flex-col bg-gray-50 md:flex-row">

      {/* Sidebar - Hidden on mobile, visible on desktop */}
      <aside className="hidden w-full bg-background md:block md:w-72 md:shrink-0 md:border-r">
        <h2 className="bg-foreground p-4 text-sm font-semibold text-background md:p-6 md:text-base">
          Onboarding Progress
        </h2>

        <ul className="space-y-2 p-4 md:space-y-4">
          {steps.map((step, i) => {
            const active = pathname === step.path;
            const completed = i < allowedIndex;
            const locked = i > allowedIndex;
            const circleText = completed || active ? "✓" : i + 1;
            const itemClass = `flex items-center gap-2 rounded p-2 text-sm transition-colors md:gap-3 md:text-base ${
              active
                ? "bg-gray-100 font-medium"
                : locked
                  ? "opacity-80 cursor-not-allowed"
                  : "hover:bg-gray-50"
            }`;
            const badgeClass = `flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold md:text-sm ${
              completed || active ? "bg-green-500 text-white" : "bg-gray-300"
            }`;

            return (
              <li key={i}>
                {locked ? (
                  <div className={itemClass} aria-disabled="true">
                    <span className={badgeClass}>{circleText}</span>
                    <span className="truncate">{step.name}</span>
                  </div>
                ) : (
                  <Link href={step.path} className={itemClass}>
                    <span className={badgeClass}>{circleText}</span>
                    <span className="truncate">{step.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10">
        <div className="mb-6 flex w-full justify-center md:mb-8">
          <Logo />
        </div>

        {/* Mobile Step Indicator */}
        <div className="mb-4 flex items-center justify-center gap-1 md:hidden">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < allowedIndex ? "bg-green-500" : i === allowedIndex ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Mobile Current Step Title */}
        <div className="mb-6 md:hidden">
          <div className="text-center text-xs font-semibold text-gray-600">
            Step {allowedIndex + 1} of {steps.length}
          </div>
          <h2 className="text-center text-base font-bold text-gray-800">
            {steps[allowedIndex]?.name}
          </h2>
        </div>

        {children}
      </main>

    </div>
  );
}
