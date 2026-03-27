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
  }, []);

  const allowedIndex = useMemo(() => {
    if (nextAllowedPath === "/provider/dashboard") {
      return steps.length;
    }
    const idx = steps.findIndex((step) => step.path === nextAllowedPath);
    return idx === -1 ? 0 : idx;
  }, [nextAllowedPath, steps]);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <aside className="w-80 bg-background border-r  shrink-0">
        <h2 className="text-xl bg-foreground p-6 text-background font-semibold mb-4">
          Onboarding Progress
        </h2>

        <ul className="space-y-4 p-4">
          {steps.map((step, i) => {
            const active = pathname === step.path;
            const completed = i < allowedIndex;
            const locked = i > allowedIndex;
            const circleText = completed || active ? "✓" : i + 1;
            const itemClass = `flex items-center text-base gap-3 p-2 rounded transition-colors ${
              active
                ? "bg-gray-100 font-medium"
                : locked
                  ? "opacity-80 cursor-not-allowed"
                  : "hover:bg-gray-50"
            }`;
            const badgeClass = `w-5 h-5 flex items-center justify-center rounded-full text-sm ${
              completed || active ? "bg-green-500 text-white" : "bg-gray-300"
            }`;

            return (
              <li key={i}>
                {locked ? (
                  <div className={itemClass} aria-disabled="true">
                    <span className={badgeClass}>{circleText}</span>
                    {step.name}
                  </div>
                ) : (
                  <Link href={step.path} className={itemClass}>
                    <span className={badgeClass}>{circleText}</span>
                    {step.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Main Content */}
      
      <main className="flex-1 p-10">
        <Logo className="flex justify-center mb-8" />
        {children}
      </main>

    </div>
  );
}
